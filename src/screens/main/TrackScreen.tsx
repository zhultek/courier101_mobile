import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React, { useEffect, useState } from 'react';
import QueryContent from '../../components/QueryContent';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GradientScreen, ScreenHeader, EmptyView, PrimaryButton } from '../../components/ui';
import { ItemCard } from '../../components/ItemCard';
import { useTrack } from '../../api/hooks';
import type { AppStackParamList, MainTabParamList } from '../../navigation/types';
import { packageTones } from '../../theme/colors';

const TABS = [
  { key: 'readyForPickup', label: 'Ready', tone: 'success' },
  { key: 'inTransit', label: 'Transit', tone: 'accent' },
  { key: 'totalShipped', label: 'Shipped', tone: 'success' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function TrackScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'Track'>>();
  const track = useTrack();
  const [tab, setTab] = useState<TabKey>(route.params?.tab ?? 'readyForPickup');

  // Dashboard stat tiles deep-link into a specific tab.
  useEffect(() => {
    if (route.params?.tab) setTab(route.params.tab);
  }, [route.params?.tab]);

  const items = track.data?.[tab] ?? [];
  const selectedTone = TABS.find((entry) => entry.key === tab)!.tone;

  return (
    <GradientScreen scroll={false}>
      <ScreenHeader title="Track packages" />
      <View className="flex-row flex-wrap gap-2 mb-4">
        {TABS.map((t) => {
          const active = tab === t.key;
          const color = packageTones[t.tone];
          const count = track.data?.[t.key]?.length;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className="items-center px-3 py-3 rounded-xl border active:opacity-75"
              style={{ flexGrow: 1, flexBasis: 86, backgroundColor: active ? color.ink : '#FFFFFF', borderColor: active ? color.ink : '#E2E8F0' }}
            >
              <Text
                className={`text-sm font-semibold text-center ${
                  active ? 'text-white' : 'text-muted'
                }`}
              >
                {typeof count === 'number' ? `${t.label} (${count})` : t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <QueryContent query={track} resource="packages">
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(120, tabBarHeight + 24) }}
          refreshControl={
            <RefreshControl
              refreshing={track.isRefetching}
              onRefresh={() => track.refetch()}
            />
          }
          ListEmptyComponent={<EmptyView message="No packages here yet" tone={selectedTone === 'accent' ? 'amber' : 'teal'} />}
          ListHeaderComponent={tab === 'readyForPickup' && track.data?.fygaroPayment ? (
            <PrimaryButton
              title="Make Payment"
              className="mb-4"
              onPress={() => navigation.navigate('FygaroPayment', { payment: track.data!.fygaroPayment! })}
            />
          ) : null}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              statusLabel={tab === 'readyForPickup' ? 'Ready for pickup' : tab === 'inTransit' ? 'In transit' : 'Shipped'}
              statusTone={tab === 'inTransit' ? 'accent' : 'success'}
              showPrice={tab === 'readyForPickup'}
              onPress={() => navigation.navigate('ItemDetails', { id: item.id })}
              onInvoicePress={
                tab === 'readyForPickup' && item.invoice_id
                  ? () => navigation.navigate('Invoice', { id: item.invoice_id! })
                  : undefined
              }
            />
          )}
        />
      </QueryContent>
    </GradientScreen>
  );
}
