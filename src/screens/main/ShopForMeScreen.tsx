import React from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AddPill,
  GradientScreen,
  Card,
  InfoRow,
  LoadingView,
  EmptyView,
  money,
} from '../../components/ui';
import { useShopForMe } from '../../api/hooks';
import type { AppStackParamList } from '../../navigation/types';

export default function ShopForMeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const shop = useShopForMe();

  return (
    <GradientScreen scroll={false}>
      <View className="flex-row items-center justify-between py-4">
        <Text className="text-3xl font-extrabold text-ink">Shop for me</Text>
        <AddPill onPress={() => navigation.navigate('CreateShopForMe')} />
      </View>
      {shop.isLoading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={shop.data?.data ?? []}
          keyExtractor={(s) => String(s.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
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
      )}
    </GradientScreen>
  );
}
