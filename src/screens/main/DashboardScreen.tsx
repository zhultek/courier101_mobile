import React from 'react';
import QueryContent from '../../components/QueryContent';
import { Image, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomTabBarHeight, type BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { GradientScreen, EmptyView, MenuButton, PrimaryButton, SectionLabel, money, tabularNums } from '../../components/ui';
import { ItemCard } from '../../components/ItemCard';
import { ShippingAddressSelector } from '../../components/ShippingAddressCard';
import { useDashboard, useShippingAddresses } from '../../api/hooks';
import { useAuth, useDeliveryEnabled } from '../../store/auth';
import type { AppStackParamList, MainTabParamList, TrackTabKey } from '../../navigation/types';

type DashboardNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<AppStackParamList>
>;

function QuickAction({ icon, label, onPress, basis }: { icon: IconName; label: string; onPress: () => void; basis: number }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} className="items-center py-2 active:opacity-60" style={{ flexGrow: 1, flexBasis: basis, minWidth: basis }}>
      <View className="w-12 h-12 rounded-2xl bg-white border border-line items-center justify-center mb-2">
        <Icon name={icon} size={21} color="#2563EB" />
      </View>
      <Text className="font-medium text-muted text-[13px] text-center">{label}</Text>
    </Pressable>
  );
}

function Stat({ value, label, icon, tint, onPress }: {
  value: number; label: string; icon: IconName; tint: string; onPress: () => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const minWidth = Math.min(width - 40, Math.max(130, 130 * fontScale));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value.toLocaleString('en-US')}. View packages`}
      className="rounded-[20px] bg-white border border-line p-4 active:opacity-70"
      style={{ flexGrow: 1, flexBasis: minWidth, minWidth }}
    >
      <View className="flex-row items-center justify-between gap-2 mb-3">
        <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: `${tint}12` }}>
          <Icon name={icon} size={18} color={tint} />
        </View>
        <Text className="text-[26px] font-semibold text-ink flex-shrink" style={tabularNums}>{value.toLocaleString('en-US')}</Text>
      </View>
      <Text className="font-medium text-muted text-sm leading-5">{label}</Text>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigation>();
  const user = useAuth((s) => s.user);
  const courier = useAuth((s) => s.courier);
  const deliveryEnabled = useDeliveryEnabled();
  const dashboard = useDashboard();
  const addresses = useShippingAddresses();
  const tabBarHeight = useBottomTabBarHeight();
  const { width, fontScale } = useWindowDimensions();
  const actionCount = deliveryEnabled ? 4 : 3;
  const availableColumns = Math.max(1, Math.floor((width - 28) / (64 * fontScale + 12)));
  const actionColumns = availableColumns >= actionCount ? actionCount : Math.min(2, availableColumns);
  const actionBasis = (width - 40 - (actionColumns - 1) * 12) / actionColumns;
  const [copyState, setCopyState] = React.useState<'idle' | 'copied' | 'error'>('idle');
  const copyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);
  const data = dashboard.data;
  const ready = data?.readyForPickupCount ?? 0;
  const goToTrack = (tab: TrackTabKey) => navigation.navigate('Track', { tab });

  return (
    <GradientScreen scroll={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(120, tabBarHeight + 24) }}
        refreshControl={<RefreshControl refreshing={dashboard.isRefetching || addresses.isRefetching} onRefresh={() => { dashboard.refetch(); addresses.refetch(); }} />}
      >
        <View className="flex-row items-center justify-between py-3 mb-3">
          <MenuButton />
          <Image
            source={courier?.logo_url ? { uri: courier.logo_url } : require('../../../assets/logo.png')}
            accessibilityLabel={courier?.code ? `${courier.code} logo` : 'Courier101'}
            style={{ height: 36, flex: 1, maxWidth: 144, marginHorizontal: 12 }}
            resizeMode="contain"
          />
          <Pressable onPress={() => navigation.navigate('Profile')} accessibilityRole="button" accessibilityLabel="Your profile" className="w-11 h-11 rounded-full bg-primary-light border border-primary-soft items-center justify-center">
            <Text className="text-primary font-semibold text-base">{(user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')}</Text>
          </Pressable>
        </View>

        <QueryContent query={dashboard} resource="your dashboard">
          <>
            <Text className="text-sm text-muted mb-1">Hi {user?.first_name ?? 'there'}</Text>
            <Text accessibilityRole="header" className="text-[28px] font-semibold text-ink mb-2">Your packages</Text>
            <Text className="text-[15px] text-muted leading-[22px] mb-5">{ready > 0 ? `${ready === 1 ? 'A package is' : `${ready} packages are`} ready for you.` : 'Keep an eye on everything coming your way.'}</Text>

            <Pressable
              onPress={() => goToTrack('readyForPickup')}
              accessibilityRole="button"
              accessibilityLabel={`Ready for pickup: ${ready}. View packages`}
              className="rounded-[22px] bg-navy p-5 mb-3 active:opacity-85"
            >
              <View className="flex-row flex-wrap items-center gap-4">
                <View className="flex-1" style={{ minWidth: 150 }}>
                  <View className="flex-row items-center mb-2">
                    <Icon name="package" size={20} color="#93C5FD" />
                    <Text className="text-[13px] font-medium ml-2 flex-shrink" style={{ color: '#B8C7E4' }}>Ready for pickup</Text>
                  </View>
                  <Text className="text-white text-[17px] leading-6 font-semibold">{ready > 0 ? 'Your next stop: pickup' : 'All caught up'}</Text>
                  <View className="flex-row items-center mt-3">
                    <Text className="text-white text-sm mr-2">View packages</Text>
                    <Icon name="arrow-right" size={16} color="#FFFFFF" />
                  </View>
                </View>
                <Text className="text-white text-[44px] font-semibold" style={tabularNums}>{ready.toLocaleString('en-US')}</Text>
              </View>
            </Pressable>

            <View className="flex-row flex-wrap gap-3 mb-4">
              <Stat value={data?.inTransit ?? 0} label="In transit" icon="truck" tint="#C2410C" onPress={() => goToTrack('inTransit')} />
              <Stat value={data?.totalShipped ?? 0} label="Total shipped" icon="check-circle" tint="#047857" onPress={() => goToTrack('totalShipped')} />
            </View>

            <View className="flex-row flex-wrap gap-x-3 gap-y-2 mb-5">
              <QuickAction basis={actionBasis} icon="bell" label="Pre-alert" onPress={() => navigation.navigate('CreatePrealert')} />
              {deliveryEnabled ? <QuickAction basis={actionBasis} icon="truck" label="Delivery" onPress={() => navigation.navigate('CreateDelivery')} /> : null}
              <QuickAction basis={actionBasis} icon="calculator" label="Calculator" onPress={() => navigation.navigate('Calculator')} />
              <QuickAction basis={actionBasis} icon="dollar-sign" label="Rates" onPress={() => navigation.navigate('Rates')} />
            </View>

            <SectionLabel title="Ready for pickup" action="View all" onAction={() => goToTrack('readyForPickup')} />
            {data?.readyForPickup?.length ? data.readyForPickup.slice(0, 3).map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                statusLabel="Ready for pickup"
                statusTone="success"
                onPress={() => navigation.navigate('ItemDetails', { id: item.id })}
                onInvoicePress={item.invoice_id ? () => navigation.navigate('Invoice', { id: item.invoice_id! }) : undefined}
              />
            )) : <EmptyView message="Nothing ready for pickup yet" />}

            <View className="rounded-[20px] bg-white border border-line p-4 mt-3 mb-6">
              <View className="flex-row flex-wrap items-center gap-3">
                <View style={{ flexGrow: 1, flexBasis: 160 }}>
                  <Text className="text-sm text-muted mb-1">Account balance</Text>
                  <Text className="text-[28px] font-semibold text-ink" style={tabularNums}>{money(data?.accountBalance)}</Text>
                </View>
                <View className="flex-row items-center rounded-xl bg-accent-light px-3 py-2" style={{ maxWidth: '100%' }}>
                  <Icon name="mailbox" size={17} color="#C2410C" />
                  <Text className="text-[13px] font-medium text-accent-dark ml-2 flex-shrink">Mailbox {user?.mailbox ?? '—'}</Text>
                </View>
              </View>
              {data?.fygaroPayment ? <PrimaryButton title="Make payment" className="mt-4" onPress={() => navigation.navigate('FygaroPayment', { payment: data.fygaroPayment! })} /> : null}
            </View>

            <SectionLabel title="Your shipping address" />
            <QueryContent query={addresses} resource="shipping addresses">
              {addresses.data?.data?.length ? <ShippingAddressSelector addresses={addresses.data.data} /> : <EmptyView message="No shipping addresses" />}
            </QueryContent>

            {data?.referralUrl ? (
              <Pressable
                onPress={async () => {
                  if (copyTimer.current) clearTimeout(copyTimer.current);
                  try {
                    await Clipboard.setStringAsync(data.referralUrl!);
                    setCopyState('copied');
                    copyTimer.current = setTimeout(() => setCopyState('idle'), 2500);
                  } catch { setCopyState('error'); }
                }}
                accessibilityRole="button"
                accessibilityLabel="Copy your referral link"
                className="rounded-[20px] border border-line bg-white p-4 mt-2 flex-row items-center active:opacity-70"
              >
                <View className="w-10 h-10 rounded-xl bg-success-light items-center justify-center mr-3"><Icon name="users" size={20} color="#047857" /></View>
                <View className="flex-1 pr-3">
                  <Text className="font-semibold text-ink text-sm mb-1">Refer a friend</Text>
                  <Text accessibilityLiveRegion="polite" className="text-muted text-[13px]">{copyState === 'copied' ? 'Referral link copied' : copyState === 'error' ? "Couldn't copy. Tap to try again." : 'Share your link with friends'}</Text>
                </View>
                <Icon name={copyState === 'copied' ? 'check' : 'copy'} size={18} color="#475569" />
              </Pressable>
            ) : null}
          </>
        </QueryContent>
      </ScrollView>
    </GradientScreen>
  );
}
