import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Icon, IconName } from '../../components/Icon';
import {
  GradientScreen,
  LoadingView,
  ScreenHeader,
  StatusChip,
  cardShadow,
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
  if (s.includes('paid')) return 'success';
  if (s.includes('partial')) return 'accent';
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

export default function InvoiceScreen({ navigation, route }: AppScreenProps<'Invoice'>) {
  const invoice = useInvoice(route.params.id);
  const authCourier = useAuth((s) => s.courier);
  const [downloading, setDownloading] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
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

  if (invoice.isLoading) {
    return (
      <GradientScreen>
        <ScreenHeader title="Invoice" onBack={() => navigation.goBack()} />
        <LoadingView />
      </GradientScreen>
    );
  }

  if (!data) {
    return (
      <GradientScreen>
        <ScreenHeader title="Invoice" onBack={() => navigation.goBack()} />
        <Text className="font-normal text-muted text-center mt-10">Invoice not found.</Text>
      </GradientScreen>
    );
  }

  // Courier branding comes from the invoice; older API responses lack the
  // block, so the logo falls back to the courier chosen at login.
  const courier = data.courier;
  const logoUrl = courier?.logo_url ?? authCourier?.logo_url ?? null;
  const courierCityLine = [courier?.city, courier?.parish].filter(Boolean).join(', ');
  const officeCityLine = [data.office?.city, data.office?.parish]
    .filter(Boolean)
    .join(', ');
  const customer = data.customer;
  const customerCityLine = [customer?.city, customer?.parish].filter(Boolean).join(', ');
  const invoiceDate = formatDate(data.invoice_date ?? data.date);
  const fees = data.invoice_items.filter((line) => line.total && line.show !== 0);
  const item = data.item;
  const showItemRow = Boolean(item && (item.tracking_number || item.warehouse_code));

  return (
    <GradientScreen>
      <ScreenHeader title="Invoice" onBack={() => navigation.goBack()} />

      <View
        className="mt-2 rounded-3xl bg-white border border-line/60 overflow-hidden"
        style={cardShadow}
      >
        {/* Header strip: invoice number + download, like the web block header */}
        <View className="flex-row items-center bg-surface/80 px-5 py-3.5 border-b border-line/70">
          <Text className="flex-1 font-semibold text-ink text-[13px] mr-3" numberOfLines={1}>
            #{data.invoice_number}
          </Text>
          <Pressable
            onPress={download}
            disabled={downloading}
            hitSlop={8}
            className="flex-row items-center active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Download invoice"
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Icon name="download-cloud" size={15} color="#2563EB" />
            )}
            <Text className="text-primary font-semibold text-[13px] ml-1.5">
              Download Invoice
            </Text>
          </Pressable>
        </View>

        <View className="px-5 pt-6">
          {/* Courier (left) and customer (right) blocks */}
          <View className="flex-row">
            <View className="flex-1 pr-3">
              {logoUrl && !logoFailed ? (
                <Image
                  source={{ uri: logoUrl }}
                  onError={() => setLogoFailed(true)}
                  resizeMode="contain"
                  accessibilityLabel={courier?.name ?? 'Courier logo'}
                  style={{ width: 128, height: 44, alignSelf: 'flex-start' }}
                />
              ) : courier?.name ? (
                <Text className="text-xl font-bold text-ink">{courier.name}</Text>
              ) : null}
              {courier?.street_address ?? data.office?.address ? (
                <Text className="font-normal text-muted text-[13px] mt-2">
                  {courier?.street_address ?? data.office?.address}
                </Text>
              ) : null}
              {courierCityLine || officeCityLine ? (
                <Text className="font-normal text-muted text-[13px] mt-0.5">
                  {courierCityLine || officeCityLine}
                </Text>
              ) : null}
              <StatusChip
                label={data.status || 'Pending'}
                tone={statusTone(data.status)}
                className="mt-3"
              />
            </View>

            <View className="flex-1 items-end">
              {customer?.name ? (
                <Text className="text-base font-semibold text-ink text-right">
                  {customer.name}
                </Text>
              ) : null}
              {customer?.address ? (
                <Text className="font-normal text-muted text-[13px] mt-2 text-right">
                  {customer.address}
                </Text>
              ) : null}
              {customerCityLine ? (
                <Text className="font-normal text-muted text-[13px] mt-0.5 text-right">
                  {customerCityLine}
                </Text>
              ) : null}
              {customer?.email ? (
                <Text className="font-normal text-muted text-[13px] mt-0.5 text-right">
                  {customer.email}
                </Text>
              ) : null}
              {invoiceDate ? (
                <Text className="font-normal text-faint text-[13px] mt-2 text-right">
                  Invoice Date: {invoiceDate}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Charges table */}
          <View className="mt-6 rounded-2xl border border-line overflow-hidden">
            <View className="flex-row bg-surface px-4 py-2.5 border-b border-line">
              <Text className="flex-1 font-semibold text-muted text-[13px]">
                Product
              </Text>
              <Text className="font-semibold text-muted text-[13px]">Amount</Text>
            </View>

            {showItemRow && item ? (
              <View className="flex-row items-start px-4 py-3.5 border-b border-line/60">
                <View className="flex-1 pr-3">
                  <Text className="font-semibold text-ink text-sm leading-5">
                    {item.tracking_number ?? '-'} -{' '}
                    <Text className="text-primary">{item.warehouse_code ?? '-'}</Text>
                    {` (${item.weight ?? '-'} lbs)`}
                  </Text>
                  {item.description ? (
                    <Text className="font-normal text-muted text-[13px] mt-1">
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Text className="font-medium text-ink text-sm" style={tabularNums}>
                  {money(data.weight_rate)}
                </Text>
              </View>
            ) : null}

            <View className="flex-row justify-end items-center px-4 py-3 border-b border-line/60">
              <Text className="font-semibold text-accent text-[13px]">Subtotal</Text>
              <Text className="font-semibold text-accent text-sm ml-8" style={tabularNums}>
                {money(data.weight_rate)}
              </Text>
            </View>

            {fees.map((line, index) => (
              <View
                key={index}
                className="flex-row justify-end items-center px-4 py-3 border-b border-line/60"
              >
                <Text
                  className="font-semibold text-ink text-[13px] flex-shrink text-right"
                  numberOfLines={1}
                >
                  {line.product}
                </Text>
                <Text className="font-medium text-ink text-sm ml-8" style={tabularNums}>
                  {money(line.total)}
                </Text>
              </View>
            ))}

            <View className="flex-row justify-end items-center bg-surface px-4 py-4">
              <Text className="font-bold text-ink text-[13px]">Total due</Text>
              <Text className="text-[17px] font-bold text-ink ml-8" style={tabularNums}>
                {money(data.total)}
              </Text>
            </View>
          </View>

          {courier?.gct_number ? (
            <Text className="text-center font-semibold text-ink text-sm mt-5">
              GCT #: {courier.gct_number}
            </Text>
          ) : null}
          {courier?.invoice_note ? (
            <Text className="text-center font-normal text-muted text-[13px] mt-4 leading-5">
              {courier.invoice_note}
            </Text>
          ) : null}
          <Text className="text-center font-normal text-faint text-[13px] mt-5 mb-6 leading-5">
            Thank you very much for doing business with us. We look forward to working
            with you again!
          </Text>
        </View>
      </View>
    </GradientScreen>
  );
}
