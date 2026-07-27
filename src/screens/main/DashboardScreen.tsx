import React from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Icon, IconName } from '../../components/Icon';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  GradientScreen,
  Card,
  LoadingView,
  EmptyView,
  MenuButton,
  SectionLabel,
  cardShadow,
  moneyParts,
  tabularNums,
} from '../../components/ui';
import { ItemCard } from '../../components/ItemCard';
import { ShippingAddressCard } from '../../components/ShippingAddressCard';
import { useDashboard, useShippingAddresses } from '../../api/hooks';
import { useAuth, useDeliveryEnabled } from '../../store/auth';
import type { AppStackParamList, TrackTabKey } from '../../navigation/types';

const CARD_WIDTH = Dimensions.get('window').width - 72;

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center active:opacity-60">
      <View
        className="w-14 h-14 rounded-2xl bg-white border border-line/60 items-center justify-center mb-1.5"
        style={cardShadow}
      >
        <Icon name={icon} size={20} color="#2563EB" />
      </View>
      <Text className="font-semibold text-ink text-[13px]">{label}</Text>
    </Pressable>
  );
}

function Stat({
  value,
  label,
  icon,
  tint,
  onPress,
}: {
  value: number;
  label: string;
  icon: IconName;
  tint: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 active:opacity-70">
      <Card className="items-start">
        <View
          className="w-9 h-9 rounded-xl items-center justify-center mb-2.5"
          style={{ backgroundColor: `${tint}1A` }}
        >
          <Icon name={icon} size={16} color={tint} />
        </View>
        <Text className="text-[26px] font-bold text-ink" style={tabularNums}>
          {value.toLocaleString('en-US')}
        </Text>
        <Text className="font-medium text-muted text-[13px] leading-[18px] mt-0.5">
          {label}
        </Text>
      </Card>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const user = useAuth((s) => s.user);
  const courier = useAuth((s) => s.courier);
  const deliveryEnabled = useDeliveryEnabled();
  const dashboard = useDashboard();
  const addresses = useShippingAddresses();
  const [copied, setCopied] = React.useState(false);

  const data = dashboard.data;

  // Dashboard lives inside the tab navigator, so sibling tabs are reachable
  // directly; the AppStack typing just doesn't know about them.
  const goToTrack = (tab: TrackTabKey) =>
    (navigation as any).navigate('Track', { tab });

  return (
    <GradientScreen scroll={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={dashboard.isRefetching}
            onRefresh={() => {
              dashboard.refetch();
              addresses.refetch();
            }}
          />
        }
      >
        <View className="flex-row items-center justify-between py-3">
          <MenuButton />
          {courier?.logo_url ? (
            <Image
              source={{ uri: courier.logo_url }}
              className="h-9 w-36"
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require('../../../assets/logo.png')}
              className="h-9 w-36"
              resizeMode="contain"
            />
          )}
          <Pressable
            onPress={() => navigation.navigate('Profile')}
            className="w-12 h-12 rounded-full bg-primary-light items-center justify-center overflow-hidden"
          >
            <Text className="text-primary font-bold text-lg">
              {(user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')}
            </Text>
          </Pressable>
        </View>

        {dashboard.isLoading ? (
          <LoadingView />
        ) : (
          <>
            <Text className="text-[22px] font-semibold text-ink mb-1">
              Hi {user?.first_name ?? 'there'}
            </Text>
            <Text className="font-normal text-muted text-[15px] leading-[22px] mb-4">
              Here's what's moving today
            </Text>

            <View className="rounded-[28px] bg-white p-6 mb-4" style={cardShadow}>
              <View className="flex-row items-center">
                <View className="flex-1 pr-4">
                  {(() => {
                    const balance = moneyParts(data?.accountBalance);
                    return (
                      <View className="flex-row items-end">
                        <Text
                          className="text-[42px] font-bold text-ink"
                          style={tabularNums}
                        >
                          {`${balance.sign}$${balance.dollars}`}
                        </Text>
                        <Text
                          className="text-xl font-bold text-faint ml-0.5 mb-[7px]"
                          style={tabularNums}
                        >
                          .{balance.cents}
                        </Text>
                      </View>
                    );
                  })()}
                  <Text className="font-normal text-muted text-[15px] leading-[22px] -mt-1">
                    Account balance
                  </Text>
                  <View className="flex-row items-center mt-4 self-start rounded-full bg-accent-light border border-accent/20 px-3.5 py-2">
                    <Icon name="inbox" size={13} color="#C2410C" />
                    <Text className="font-semibold text-accent-dark text-[13px] ml-1.5">
                      Mailbox {user?.mailbox ?? '-'}
                    </Text>
                  </View>
                </View>
                <View className="w-20 h-20 rounded-full bg-accent-light items-center justify-center">
                  <View className="w-14 h-14 rounded-full bg-accent-soft items-center justify-center">
                    <Icon name="credit-card" size={24} color="#F97316" />
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3 mb-6">
              <QuickAction
                icon="bell"
                label="Pre-alert"
                onPress={() => navigation.navigate('CreatePrealert')}
              />
              {deliveryEnabled ? (
                <QuickAction
                  icon="truck"
                  label="Delivery"
                  onPress={() => navigation.navigate('CreateDelivery')}
                />
              ) : null}
              <QuickAction
                icon="percent"
                label="Calculator"
                onPress={() => navigation.navigate('Calculator')}
              />
              <QuickAction
                icon="dollar-sign"
                label="Rates"
                onPress={() => navigation.navigate('Rates')}
              />
            </View>

            <View className="flex-row gap-3 mb-6">
              <Stat
                value={data?.readyForPickupCount ?? 0}
                label={'Ready for\npickup'}
                icon="package"
                tint="#2563EB"
                onPress={() => goToTrack('readyForPickup')}
              />
              <Stat
                value={data?.inTransit ?? 0}
                label={'In\ntransit'}
                icon="truck"
                tint="#F97316"
                onPress={() => goToTrack('inTransit')}
              />
              <Stat
                value={data?.totalShipped ?? 0}
                label={'Total\nshipped'}
                icon="check-circle"
                tint="#059669"
                onPress={() => goToTrack('totalShipped')}
              />
            </View>

            <SectionLabel
              title="Ready for pickup"
              action="View all"
              onAction={() => goToTrack('readyForPickup')}
            />
            {data?.readyForPickup?.length ? (
              <FlatList
                horizontal
                data={data.readyForPickup}
                keyExtractor={(i) => String(i.id)}
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + 12}
                decelerationRate="fast"
                renderItem={({ item }) => (
                  <View style={{ width: CARD_WIDTH, marginRight: 12 }}>
                    <ItemCard
                      item={item}
                      onPress={() =>
                        navigation.navigate('ItemDetails', { id: item.id })
                      }
                      onInvoicePress={
                        item.invoice_id
                          ? () =>
                              navigation.navigate('Invoice', { id: item.invoice_id! })
                          : undefined
                      }
                    />
                  </View>
                )}
              />
            ) : (
              <EmptyView message="Nothing ready for pickup yet" />
            )}

            <SectionLabel title="Shipping addresses" className="mt-6" />
            {addresses.data?.data?.length ? (
              addresses.data.data.map((addr, index) => (
                <ShippingAddressCard key={index} address={addr} />
              ))
            ) : (
              <EmptyView message="No shipping addresses" />
            )}

            {data?.referralUrl ? (
              <Pressable
                onPress={async () => {
                  await Clipboard.setStringAsync(data.referralUrl!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="rounded-2xl bg-success-light border border-success/20 p-4 mt-2 flex-row items-center active:opacity-80"
              >
                <View className="flex-1 pr-3">
                  <Text className="font-semibold text-success text-sm mb-1">
                    Refer a friend
                  </Text>
                  <Text className="font-normal text-ink" numberOfLines={1}>
                    {data.referralUrl}
                  </Text>
                </View>
                <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                  <Icon
                    name={copied ? 'check' : 'copy'}
                    size={18}
                    color={copied ? '#059669' : '#0F172A'}
                  />
                </View>
              </Pressable>
            ) : null}
            {copied ? (
              <Text className="font-normal text-center text-muted text-sm mt-2">
                Referral link copied
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </GradientScreen>
  );
}
