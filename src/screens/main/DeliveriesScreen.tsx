import React from 'react';
import {FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Icon, IconName } from '../../components/Icon';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AddPill,
  GradientScreen,
  Card,
  InfoRow,
  LoadingView,
  EmptyView,
  StatusChip,
  money,
} from '../../components/ui';
import { useDeliveries, useDeleteDelivery } from '../../api/hooks';
import type { AppStackParamList } from '../../navigation/types';
import { confirmAction, notify } from '../../utils/dialogs';

export default function DeliveriesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const deliveries = useDeliveries();
  const remove = useDeleteDelivery();

  const confirmDelete = (id: number) => {
    confirmAction('Cancel delivery', 'Remove this delivery request?', 'Remove', () =>
      remove.mutate(id)
    );
  };

  return (
    <GradientScreen scroll={false}>
      <View className="flex-row items-center justify-between py-4">
        <Text className="text-3xl font-extrabold text-ink">Deliveries</Text>
        <AddPill onPress={() => navigation.navigate('CreateDelivery')} />
      </View>
      {deliveries.isLoading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={deliveries.data?.data ?? []}
          keyExtractor={(d) => String(d.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={deliveries.isRefetching}
              onRefresh={() => deliveries.refetch()}
            />
          }
          ListEmptyComponent={<EmptyView message="No delivery requests yet" />}
          renderItem={({ item }) => (
            <Card className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-ink">{item.location}</Text>
                  <Text className="font-normal text-muted">
                    {[item.street_address, item.parish].filter(Boolean).join(', ')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => confirmDelete(item.id)}
                  className="w-11 h-11 rounded-full border border-line items-center justify-center"
                >
                  <Icon name="trash-2" size={18} color="#DC2626" />
                </Pressable>
              </View>
              {item.status ? <StatusChip label={item.status} className="mb-3" /> : null}
              <View className="rounded-2xl bg-surface px-4 py-2">
                <InfoRow label="Items" value={item.item_count} />
                <InfoRow label="Total" value={money(item.total)} />
                <InfoRow label="Delivery Date" value={item.delivery_date} />
              </View>
            </Card>
          )}
        />
      )}
    </GradientScreen>
  );
}
