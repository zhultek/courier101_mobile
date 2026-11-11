import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React from 'react';
import QueryContent from '../../components/QueryContent';
import {FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Icon, IconName } from '../../components/Icon';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AddPill,
  ScreenHeader,
  GradientScreen,
  Card,
  InfoRow,
  EmptyView,
  IconTile,
  StatusChip,
  money,
} from '../../components/ui';
import { useDeliveries, useDeleteDelivery } from '../../api/hooks';
import type { AppStackParamList } from '../../navigation/types';
import { confirmAction, notify } from '../../utils/dialogs';
import { featureTones } from '../../theme/colors';

export default function DeliveriesScreen() {
  const tabBarHeight = useBottomTabBarHeight();
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
      <ScreenHeader title="Deliveries" right={<AddPill onPress={() => navigation.navigate('CreateDelivery')} />} />
      <QueryContent query={deliveries} resource="delivery requests">
        <FlatList
          data={deliveries.data?.data ?? []}
          keyExtractor={(d) => String(d.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(120, tabBarHeight + 24) }}
          refreshControl={
            <RefreshControl
              refreshing={deliveries.isRefetching}
              onRefresh={() => deliveries.refetch()}
            />
          }
          ListEmptyComponent={<EmptyView message="No delivery requests yet" icon="truck" tone={featureTones.delivery} />}
          renderItem={({ item }) => (
            <Card className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <IconTile icon="truck" tint={featureTones.delivery} size="sm" />
                <View className="flex-1 mx-3">
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
      </QueryContent>
    </GradientScreen>
  );
}
