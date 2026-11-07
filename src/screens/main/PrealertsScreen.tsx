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
  EmptyView,
  money,
  tabularNums,
} from '../../components/ui';
import { usePrealerts } from '../../api/hooks';
import type { AppStackParamList } from '../../navigation/types';

export default function PrealertsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const prealerts = usePrealerts();

  return (
    <GradientScreen scroll={false}>
      <ScreenHeader title="Prealerts" right={<AddPill onPress={() => navigation.navigate('CreatePrealert')} />} />
      <QueryContent query={prealerts} resource="prealerts">
        <FlatList
          data={prealerts.data?.data ?? []}
          keyExtractor={(p) => String(p.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(120, tabBarHeight + 24) }}
          refreshControl={
            <RefreshControl
              refreshing={prealerts.isRefetching}
              onRefresh={() => prealerts.refetch()}
            />
          }
          ListEmptyComponent={<EmptyView message="No prealerts yet" />}
          renderItem={({ item }) => (
            <Card className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-ink">{item.carrier}</Text>
                  <Text className="font-normal text-muted">{item.tracking_number}</Text>
                </View>
                <Text className="text-lg font-semibold text-ink" style={tabularNums}>
                  {money(item.value)}
                </Text>
              </View>
              <View className="rounded-2xl bg-surface p-4">
                <Text className="font-normal text-muted text-sm">Description</Text>
                <Text className="font-normal text-ink" numberOfLines={2}>
                  {item.description}
                </Text>
                <Text className="font-normal text-muted text-sm mt-2">Created</Text>
                <Text className="font-normal text-ink">{item.created_at}</Text>
              </View>
            </Card>
          )}
        />
      </QueryContent>
    </GradientScreen>
  );
}
