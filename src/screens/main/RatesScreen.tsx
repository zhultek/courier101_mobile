import React from 'react';
import { FlatList, Text, View } from 'react-native';
import {
  GradientScreen,
  Card,
  LoadingView,
  EmptyView,
  ScreenHeader,
  money,
  tabularNums,
} from '../../components/ui';
import { useRates } from '../../api/hooks';
import type { AppScreenProps } from '../../navigation/types';

export default function RatesScreen({ navigation }: AppScreenProps<'Rates'>) {
  const rates = useRates();

  return (
    <GradientScreen scroll={false}>
      <ScreenHeader title="Shipping rates" onBack={() => navigation.goBack()} />
      {rates.isLoading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={rates.data?.data ?? []}
          keyExtractor={(r) => String(r.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={<EmptyView message="No rates published" />}
          ListHeaderComponent={
            <View className="mb-3 flex-row rounded-2xl bg-primary px-5 py-4">
              <Text className="flex-1 text-white font-semibold">Weight (lbs)</Text>
              <Text className="text-white font-semibold">Rate</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card className="mb-2 flex-row items-center px-5 py-3">
              <Text className="font-normal flex-1 text-ink" style={tabularNums}>
                {item.weight}
              </Text>
              <Text className="text-ink font-semibold" style={tabularNums}>
                {money(item.rate)}
              </Text>
              <Text className="font-medium text-faint text-[13px] ml-1.5">
                {item.currency}
              </Text>
            </Card>
          )}
        />
      )}
    </GradientScreen>
  );
}
