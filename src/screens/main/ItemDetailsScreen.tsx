import React from 'react';
import QueryContent from '../../components/QueryContent';
import { Text, View } from 'react-native';
import { Icon, IconName } from '../../components/Icon';
import {
  GradientScreen,
  Card,
  InfoRow,
  PrimaryButton,
  ScreenHeader,
  money,
  tabularNums,
} from '../../components/ui';
import { useInvoice, useItem } from '../../api/hooks';
import { isInTransit } from '../../api/types';
import type { AppScreenProps } from '../../navigation/types';

export default function ItemDetailsScreen({
  navigation,
  route,
}: AppScreenProps<'ItemDetails'>) {
  const item = useItem(route.params.id);
  const data = item.data?.data;
  const inTransit = data ? isInTransit(data) : false;
  const invoice = useInvoice(inTransit ? null : data?.invoice_id ?? null);
  const invoiceData = invoice.data?.data;

  return (
    <GradientScreen>
      <ScreenHeader title="Item details" onBack={() => navigation.goBack()} />
      <QueryContent query={item} resource="package details">
        {data ? (
          <>
            <Card className="mt-2">
              <View className="flex-row items-center mb-4">
                <View className="w-14 h-14 rounded-2xl bg-primary items-center justify-center">
                  <Icon name="package" size={24} color="#fff" />
                </View>
                <View className="ml-4">
                  <Text className="text-2xl font-bold text-ink">{data.warehouse_code}</Text>
                  <Text className="font-normal text-muted">{data.tracking_number}</Text>
                </View>
              </View>
              <View className="flex-row justify-between items-start border-t border-line pt-4 mb-4">
                <Text className="font-normal text-lg text-ink flex-1 pr-4">{data.description}</Text>
                {!inTransit ? (
                  <Text
                    className="text-2xl font-extrabold text-ink"
                    style={tabularNums}
                  >
                    {money(data.total)}
                  </Text>
                ) : null}
              </View>
              <View className="rounded-2xl bg-surface px-4 py-2">
                <InfoRow label="Sender" value={data.sender || '-'} />
                <InfoRow label="Location" value={data.location || '-'} />
                <InfoRow label="Status" value={data.status || '-'} />
                <InfoRow label="Weight" value={`${data.weight} lbs`} />
                <InfoRow label="Prealert" value={data.prealert ? 'Yes' : 'No'} />
                <InfoRow label="Created" value={data.created_at} />
              </View>
              {inTransit && !data.prealert ? (
                <PrimaryButton
                  title="Upload prealert"
                  className="mt-4"
                  onPress={() =>
                    navigation.navigate('CreatePrealert', {
                      trackingNumber: data.tracking_number,
                    })
                  }
                />
              ) : null}
            </Card>

            {!inTransit && data.invoice_id ? (
              <QueryContent query={invoice} resource="invoice">
                {invoiceData ? (
                  <Card className="mt-4">
                    <Text className="text-lg font-semibold text-ink mb-2">
                      Invoice #{invoiceData.invoice_number}
                    </Text>
                    <View className="rounded-2xl bg-surface px-4 py-2">
                      <InfoRow label="Total" value={money(invoiceData.total)} />
                      <InfoRow label="Status" value={invoiceData.status} />
                    </View>
                    <PrimaryButton
                      title="View invoice"
                      className="mt-4"
                      onPress={() => navigation.navigate('Invoice', { id: invoiceData.id })}
                    />
                  </Card>
                ) : null}
              </QueryContent>
            ) : null}
          </>
        ) : (
          <Text className="font-normal text-muted text-center mt-10">Item not found.</Text>
        )}
      </QueryContent>
    </GradientScreen>
  );
}
