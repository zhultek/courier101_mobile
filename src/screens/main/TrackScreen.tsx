import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GradientScreen, LoadingView, EmptyView, cardShadow } from '../../components/ui';
import { ItemCard } from '../../components/ItemCard';
import { useTrack } from '../../api/hooks';
import type { AppStackParamList, MainTabParamList } from '../../navigation/types';

const TABS = [
  { key: 'readyForPickup', label: 'Ready' },
  { key: 'inTransit', label: 'Transit' },
  { key: 'totalShipped', label: 'Shipped' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function TrackScreen() {
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

  return (
    <GradientScreen scroll={false}>
      <View className="rounded-[32px] bg-white px-7 py-6 mt-2 mb-6" style={cardShadow}>
        <Text className="text-[34px] font-bold text-ink">Track</Text>
      </View>
      <View className="flex-row gap-3 mb-6">
        {TABS.map((t) => {
          const active = tab === t.key;
          const count = track.data?.[t.key]?.length;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              className={`flex-1 items-center px-2 py-3 rounded-full ${
                active ? 'bg-primary active:bg-primary-dark' : 'bg-white active:bg-surface'
              }`}
              style={active ? undefined : cardShadow}
            >
              <Text
                className={`text-[16px] font-semibold ${
                  active ? 'text-white' : 'text-muted'
                }`}
              >
                {typeof count === 'number' ? `${t.label} (${count})` : t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {track.isLoading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={track.isRefetching}
              onRefresh={() => track.refetch()}
            />
          }
          ListEmptyComponent={<EmptyView message="No packages here yet" />}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
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
      )}
    </GradientScreen>
  );
}
