import { useBranding } from '../../theme/BrandingProvider';
import React, { useState } from 'react';
import QueryContent from '../../components/QueryContent';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Icon } from '../../components/Icon';
import {
  GradientScreen,
  ScreenHeader,
  Card,
  money,
  tabularNums,
} from '../../components/ui';
import { useInvoice } from '../../api/hooks';
import { useAuth } from '../../store/auth';
import { API_URL } from '../../config';
import { notify } from '../../utils/dialogs';
import type { AppScreenProps } from '../../navigation/types';

function statusTone(status: string): 'success' | 'danger' | 'accent' | 'neutral' {
  const s = status.toLowerCase();
  if (s.includes('not paid') || s.includes('unpaid') || s.includes('overdue')) {
    return 'danger';
  }
  if (s.includes('partial')) return 'accent';
  if (s.includes('paid')) return 'success';
  return 'neutral';
}

/** "2025-09-17 ..." -> "September 17, 2025", matching the web invoice. */
function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  // Parse the date part as local time: a bare "YYYY-MM-DD" would otherwise be
  // read as UTC midnight and render one day early west of Greenwich.
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

async function downloadInvoicePdf(id: number, invoiceNumber: string) {
  const headers: Record<string, string> = { Accept: 'application/pdf' };
  const token = useAuth.getState().token;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/api/invoice/${id}/download`, { headers });
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? 'Invoice download is not available yet.'
        : `Download failed (${response.status}).`
    );
  }

  const filename = `invoice-${invoiceNumber}.pdf`;

  if (Platform.OS === 'web') {
    const href = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(href);
    return;
  }

  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true, intermediates: true });
  file.write(new Uint8Array(await response.arrayBuffer()));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `Invoice ${invoiceNumber}`,
  });
}

const statusColors = {
  success: { backgroundColor: '#ECFDF5', color: '#047857' },
  danger: { backgroundColor: '#FEF2F2', color: '#B91C1C' },
  accent: { backgroundColor: '#FFFBEB', color: '#92400E' },
  neutral: { backgroundColor: '#F1F5F9', color: '#475569' },
} as const;

function InvoiceAmount({ label, amount, total = false }: { label: string; amount: number; total?: boolean }) {
  return (
    <View className={`flex-row flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3 ${total ? 'border-t border-line mt-2' : ''}`}>
      <Text
        className={`text-sm leading-[22px] ${total ? 'font-semibold text-ink' : 'text-muted'}`}
        style={{ flexGrow: 1, flexBasis: 136 }}
      >
        {label}
      </Text>
      <Text
        className={`leading-[22px] ${total ? 'text-lg font-semibold text-ink' : 'text-sm font-medium text-ink'}`}
        style={[tabularNums, { maxWidth: '100%' }]}
      >
        {money(amount)}
      </Text>
    </View>
  );
}

function PackageDetail({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: 108 }}>
      <Text className="text-[12px] text-muted mb-1">{label}</Text>
      <Text selectable className="text-sm font-semibold text-ink leading-[22px]" style={tabularNums}>{value}</Text>
    </View>
  );
}

export default function InvoiceScreen({ navigation, route }: AppScreenProps<'Invoice'>) {
  const brand = useBranding();
  const invoice = useInvoice(route.params.id);
  const authCourier = useAuth((s) => s.courier);
  const { fontScale } = useWindowDimensions();
  const [downloading, setDownloading] = useState(false);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const [billingExpanded, setBillingExpanded] = useState(false);
  const data = invoice.data?.data;

  const download = async () => {
    if (!data || downloading) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(data.id, data.invoice_number);
    } catch (e) {
      notify('Download failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!data) {
    return (
      <GradientScreen>
        <ScreenHeader title="Invoice" onBack={() => navigation.goBack()} />
        <QueryContent query={invoice} resource="invoice">
          <Text className="text-muted text-center mt-10">Invoice not found.</Text>
        </QueryContent>
      </GradientScreen>
    );
  }

  const courier = data.courier;
  const logoUrl = courier?.logo_url ?? authCourier?.logo_url ?? null;
  const courierAddress = courier?.street_address ?? data.office?.address;
  const courierCityLine = [courier?.city, courier?.parish].filter(Boolean).join(', ')
    || [data.office?.city, data.office?.parish].filter(Boolean).join(', ');
  const customer = data.customer;
  const customerCityLine = [customer?.city, customer?.parish].filter(Boolean).join(', ');
  const arrivalDate = formatDate(data.invoice_date);
  const paymentDate = formatDate(data.payment_date);
  const fees = data.invoice_items.filter((line) => line.total && line.show !== 0);
  const item = data.item;
  const showPackage = Boolean(item && (item.tracking_number || item.warehouse_code || item.description || item.weight != null));
  const hasIssuerDetails = Boolean(courier?.name || courierAddress || courierCityLine);
  const hasCustomerDetails = Boolean(customer?.name || customer?.address || customerCityLine || customer?.email);
  const tone = statusColors[statusTone(data.status)];

  return (
    <GradientScreen>
      <ScreenHeader
        title="Invoice"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            onPress={download}
            disabled={downloading}
            accessibilityRole="button"
            accessibilityLabel="Download invoice"
            accessibilityState={{ disabled: downloading, busy: downloading }}
            className="min-h-[44px] min-w-[72px] flex-row items-center justify-center rounded-xl bg-white border border-line px-3 active:opacity-60"
          >
            {downloading ? <ActivityIndicator size="small" color={brand.primary} /> : <Icon name="download-cloud" size={19} color={brand.primary} />}
            <Text className="text-primary font-semibold text-sm ml-2">{downloading ? 'Preparing…' : 'PDF'}</Text>
          </Pressable>
        }
      />

      <QueryContent query={invoice} resource="invoice">
        <View className="rounded-[24px] bg-navy p-5 mt-1 mb-4">
          <View className="flex-row items-center mb-5">
            {logoUrl && logoUrl !== failedLogoUrl ? (
              <View className="w-14 h-12 rounded-xl bg-white items-center justify-center mr-3">
                <Image
                  source={{ uri: logoUrl }}
                  onError={() => setFailedLogoUrl(logoUrl)}
                  resizeMode="contain"
                  accessibilityLabel={courier?.name ?? 'Courier logo'}
                  style={{ width: 48, height: 38 }}
                />
              </View>
            ) : null}
            <View className="flex-1 min-w-0">
              <Text className="text-white text-base font-semibold leading-[23px]">{courier?.name || 'Courier invoice'}</Text>
              <Text selectable className="text-sm leading-5 mt-1" style={{ color: '#B8C7E4' }}>Invoice #{data.invoice_number}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap items-center justify-between gap-3 mb-1">
            <Text className="text-sm" style={{ color: '#B8C7E4' }}>Invoice total</Text>
            <View accessible accessibilityLabel={`Payment status: ${data.status || 'Pending'}`} className="self-start rounded-lg px-2.5 py-1.5" style={{ backgroundColor: tone.backgroundColor, maxWidth: '100%' }}>
              <Text className="text-[13px] font-semibold" style={{ color: tone.color }}>{data.status || 'Pending'}</Text>
            </View>
          </View>
          <Text
            selectable
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            numberOfLines={1}
            className="text-white text-[34px] font-semibold mt-1 mb-4"
            style={tabularNums}
          >
            {money(data.total)}
          </Text>
          {arrivalDate || paymentDate ? (
            <View className="border-t border-navy-line pt-3 gap-1">
              {arrivalDate ? <Text className="text-[13px] leading-5" style={{ color: '#B8C7E4' }}>Arrival date {arrivalDate}</Text> : null}
              {paymentDate ? <Text className="text-[13px] leading-5" style={{ color: '#B8C7E4' }}>Payment date {paymentDate}</Text> : null}
            </View>
          ) : null}
        </View>

        <Card className="mb-4 pb-1">
          <Text accessibilityRole="header" className="text-base font-semibold text-ink mb-1">Charge breakdown</Text>
          <InvoiceAmount label="Package weight charge" amount={data.weight_rate} />
          {fees.map((line, index) => <InvoiceAmount key={index} label={line.product} amount={line.total} />)}
          <InvoiceAmount label="Total" amount={data.total} total />
        </Card>

        {showPackage && item ? (
          <Card className="mb-4">
            <View className="flex-row items-start mb-4">
              <View className="w-10 h-10 rounded-xl bg-primary-light items-center justify-center mr-3">
                <Icon name="package" size={21} color={brand.primary} />
              </View>
              <View className="flex-1 min-w-0">
                <Text accessibilityRole="header" className="text-base font-semibold text-ink leading-[23px]">{item.description || 'Package details'}</Text>
                {item.description ? <Text className="text-[13px] text-muted mt-0.5">Package details</Text> : null}
              </View>
            </View>
            {item.tracking_number ? (
              <View className="mb-3">
                <Text className="text-[12px] text-muted mb-1">Tracking number</Text>
                <Text selectable className="text-sm text-ink font-medium leading-[22px]" style={tabularNums}>{item.tracking_number}</Text>
              </View>
            ) : null}
            {item.warehouse_code || item.weight != null ? (
              <View className="flex-row flex-wrap gap-x-4 gap-y-3 border-t border-line pt-3">
                {item.warehouse_code ? <PackageDetail label="Warehouse code" value={item.warehouse_code} /> : null}
                {item.weight != null ? <PackageDetail label="Weight" value={`${item.weight} lbs`} /> : null}
              </View>
            ) : null}
          </Card>
        ) : null}

        {hasIssuerDetails || hasCustomerDetails ? (
          <Card className="mb-4">
            <Pressable
              onPress={() => setBillingExpanded((expanded) => !expanded)}
              accessibilityRole="button"
              accessibilityLabel={billingExpanded ? 'Hide billing details' : 'Show billing details'}
              accessibilityState={{ expanded: billingExpanded }}
              className="flex-row items-center min-h-[44px] active:opacity-60"
            >
              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold text-ink">Billing details</Text>
                <Text className="text-sm text-muted leading-[22px] mt-1">{customer?.name ? `Billed to ${customer.name}` : 'Issuer and recipient information'}</Text>
              </View>
              <Icon name={billingExpanded ? 'chevron-down' : 'chevron-right'} size={19} color="#64748B" />
            </Pressable>
            {billingExpanded ? (
              <View className="flex-row flex-wrap gap-5 border-t border-line mt-3 pt-4">
                {hasIssuerDetails ? (
                  <View style={{ flexGrow: 1, flexBasis: 136 * fontScale }}>
                    <Text className="text-[12px] font-medium text-muted mb-2">From</Text>
                    {courier?.name ? <Text className="text-sm font-semibold text-ink leading-[22px]">{courier.name}</Text> : null}
                    {courierAddress ? <Text selectable className="text-sm text-muted leading-[22px]">{courierAddress}</Text> : null}
                    {courierCityLine ? <Text className="text-sm text-muted leading-[22px]">{courierCityLine}</Text> : null}
                  </View>
                ) : null}
                {hasCustomerDetails ? (
                  <View style={{ flexGrow: 1, flexBasis: 136 * fontScale }}>
                    <Text className="text-[12px] font-medium text-muted mb-2">Bill to</Text>
                    {customer?.name ? <Text className="text-sm font-semibold text-ink leading-[22px]">{customer.name}</Text> : null}
                    {customer?.address ? <Text selectable className="text-sm text-muted leading-[22px]">{customer.address}</Text> : null}
                    {customerCityLine ? <Text className="text-sm text-muted leading-[22px]">{customerCityLine}</Text> : null}
                    {customer?.email ? <Text selectable className="text-sm text-muted leading-[22px] mt-1">{customer.email}</Text> : null}
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>
        ) : null}

        {courier?.invoice_note ? (
          <View className="rounded-[20px] bg-primary-light border border-primary-soft p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Icon name="credit-card" size={18} color={brand.primary} />
              <Text accessibilityRole="header" className="text-sm font-semibold text-ink ml-2 flex-shrink">Payment information</Text>
            </View>
            <Text selectable className="text-sm text-muted leading-6">{courier.invoice_note}</Text>
          </View>
        ) : null}
        {courier?.gct_number ? <Text selectable className="text-[13px] text-muted text-center mb-3">GCT #: {courier.gct_number}</Text> : null}
        <Text className="text-sm text-muted text-center leading-[22px] px-4 mt-1 mb-2">Thank you for shipping with {courier?.name || 'us'}.</Text>
      </QueryContent>
    </GradientScreen>
  );
}
