import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React from 'react';
import QueryContent from '../../components/QueryContent';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AddPill,
  ScreenHeader,
  GradientScreen,
  Card,
  InfoRow,
  EmptyView,
  money,
} from '../../components/ui';
import { useShopForMe } from '../../api/hooks';
import type { AppStackParamList } from '../../navigation/types';

export default function ShopForMeScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const shop = useShopForMe();

  return (
    <GradientScreen scroll={false}>
      <ScreenHeader title="Shop for me" right={<AddPill onPress={() => navigation.navigate('CreateShopForMe')} />} />
      <QueryContent query={shop} resource="shop-for-me requests">
        <FlatList
          data={shop.data?.data ?? []}
          keyExtractor={(s) => String(s.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(120, tabBarHeight + 24) }}
          refreshControl={
            <RefreshControl
              refreshing={shop.isRefetching}
              onRefresh={() => shop.refetch()}
            />
          }
          ListEmptyComponent={<EmptyView message="No shop-for-me requests yet" />}
          renderItem={({ item }) => (
            <Card className="mb-4">
              <Text className="text-lg font-semibold text-ink mb-2">{item.name}</Text>
              <View className="rounded-2xl bg-surface px-4 py-2">
                <InfoRow label="Value" value={money(item.value)} />
                <InfoRow label="Quantity" value={item.quantity} />
                {item.weight ? <InfoRow label="Weight" value={`${item.weight} lbs`} /> : null}
                {item.created_at ? <InfoRow label="Requested" value={item.created_at} /> : null}
              </View>
            </Card>
          )}
        />
      </QueryContent>
    </GradientScreen>
  );
}
