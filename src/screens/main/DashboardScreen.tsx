import type { DashboardCardTone } from '../../theme/branding';
import { useBranding } from '../../theme/BrandingProvider';
import React from 'react';
import QueryContent from '../../components/QueryContent';
import { Image, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomTabBarHeight, type BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { GradientScreen, EmptyView, MenuButton, SectionLabel, money, tabularNums } from '../../components/ui';
import { ItemCard } from '../../components/ItemCard';
import { ShippingAddressSelector } from '../../components/ShippingAddressCard';
import { useDashboard, useShippingAddresses } from '../../api/hooks';
import { useAuth, useDeliveryEnabled } from '../../store/auth';
import type { AppStackParamList, MainTabParamList, TrackTabKey } from '../../navigation/types';
import { colorTones, featureTones, type ColorTone } from '../../theme/colors';

type DashboardNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<AppStackParamList>
>;

function QuickAction({ icon, label, onPress, basis, tone }: { icon: IconName; label: string; onPress: () => void; basis: number; tone: ColorTone }) {
  const color = colorTones[tone];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} className="items-center py-2 active:opacity-60" style={{ flexGrow: 1, flexBasis: basis, minWidth: basis }}>
      <View className="w-12 h-12 rounded-2xl border items-center justify-center mb-2" style={{ backgroundColor: color.surface, borderColor: color.border }}>
        <Icon name={icon} size={21} color={color.ink} />
      </View>
      <Text className="font-medium text-muted text-[13px] text-center">{label}</Text>
    </Pressable>
  );
}

function Stat({ value, label, icon, color, onPress }: {
  value: number; label: string; icon: IconName; color: DashboardCardTone; onPress: () => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const minWidth = Math.min(width - 40, Math.max(130, 130 * fontScale));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value.toLocaleString('en-US')}. View packages`}
      className="rounded-[20px] border p-4 active:opacity-70"
      style={{ flexGrow: 1, flexBasis: minWidth, minWidth, backgroundColor: color.surface, borderColor: color.border }}
    >
      <View className="flex-row items-center justify-between gap-2 mb-3">
        <View className="w-9 h-9 rounded-xl bg-white items-center justify-center">
          <Icon name={icon} size={18} color={color.ink} />
        </View>
        <Text className="text-[26px] font-semibold text-ink flex-shrink" style={[tabularNums, { color: color.text }]}>{value.toLocaleString('en-US')}</Text>
      </View>
      <Text className="font-medium text-muted text-sm leading-5" style={{ color: color.muted }}>{label}</Text>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const brand = useBranding();
  const navigation = useNavigation<DashboardNavigation>();
  const user = useAuth((s) => s.user);
  const courier = useAuth((s) => s.courier);
  const logoUrl = courier?.logo_url;
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
            source={logoUrl ? { uri: logoUrl } : require('../../../assets/logo.png')}
            accessibilityLabel={courier?.code ? `${courier.code} logo` : 'Courier101'}
            style={{ backgroundColor: 'transparent', height: 36, flex: 1, maxWidth: 144, marginHorizontal: 12 }}
            resizeMode="contain"
          />
          <Pressable onPress={() => navigation.navigate('Profile')} accessibilityRole="button" accessibilityLabel="Your profile" className="w-11 h-11 rounded-full bg-primary-light border border-primary-soft items-center justify-center">
            <Text className="text-primary font-semibold text-base">{(user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')}</Text>
          </Pressable>
        </View>

        <QueryContent query={dashboard} resource="your dashboard">
          <>
            <Text className="text-sm text-muted mb-1">Hi {user?.first_name ?? 'there'}</Text>

            <View
              className="rounded-[24px] border border-primary-soft overflow-hidden mt-3 mb-5"
              style={{ boxShadow: '0px 8px 24px rgba(37, 99, 235, 0.08)' }}
            >
              <LinearGradient colors={[brand.primaryLight, '#FFFFFF', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
                <View className="flex-row items-start gap-3">
                  <View className="flex-1" style={{ minWidth: 0 }}>
                    <Text className="text-[13px] font-medium text-primary-dark mb-1">Account balance</Text>
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} className="text-[36px] leading-[44px] font-semibold text-navy" style={[tabularNums, { letterSpacing: -1 }]}>{money(data?.accountBalance)}</Text>
                  </View>
                  <View className="w-12 h-12 rounded-2xl bg-white border border-primary-soft items-center justify-center" accessible={false}>
                    <Icon name="credit-card" size={24} color={brand.primary} />
                  </View>
                </View>
                {data?.pointsEnabled ? (
                  <View className="flex-row items-center gap-2 mt-3" accessible accessibilityLabel={`Points: ${(data.pointsBalance ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`}>
                    <Icon name="coins" size={18} color={brand.primary} />
                    <Text className="text-sm font-semibold text-primary-dark flex-shrink" style={tabularNums}>
                      {(data.pointsBalance ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} points
                    </Text>
                  </View>
                ) : null}
                <View className="flex-row flex-wrap items-center gap-3 border-t border-primary-soft pt-4 mt-4">
                  <View className="flex-row items-center gap-2" style={{ flexGrow: 1, flexBasis: 120, minWidth: 0 }}>
                    <Icon name="mailbox" size={20} color={brand.accent} />
                    <View className="flex-1">
                      <Text className="text-xs text-muted mb-0.5">Mailbox</Text>
                      <Text className="text-sm font-semibold text-navy">{user?.mailbox ?? '—'}</Text>
                    </View>
                  </View>
                  {data?.fygaroPayment ? (
                    <Pressable
                      onPress={() => navigation.navigate('FygaroPayment', { payment: data.fygaroPayment! })}
                      accessibilityRole="button"
                      accessibilityLabel="Make payment"
                      className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 active:bg-primary-dark"
                      style={{ minHeight: 48, flexGrow: 1, flexBasis: 148 }}
                    >
                      <Text className="text-sm font-semibold text-white flex-shrink">Make payment</Text>
                      <Icon name="arrow-up-right" size={18} color="#FFFFFF" />
                    </Pressable>
                  ) : null}
                </View>
              </LinearGradient>
            </View>

            <Text accessibilityRole="header" className="text-[28px] font-semibold text-ink mb-2">Your packages</Text>
            <Text className="text-[15px] text-muted leading-[22px] mb-5">{ready > 0 ? `${ready === 1 ? 'A package is' : `${ready} packages are`} ready for you.` : 'Keep an eye on everything coming your way.'}</Text>

            <Pressable
              onPress={() => goToTrack('readyForPickup')}
              accessibilityRole="button"
              accessibilityLabel={`Ready for pickup: ${ready}. View packages`}
              className="rounded-[22px] bg-navy mb-3 overflow-hidden active:opacity-85"
            >
              <LinearGradient colors={[brand.headerStart, brand.headerEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
                <View className="flex-row flex-wrap items-center gap-4">
                  <View className="flex-1" style={{ minWidth: 150 }}>
                    <View className="flex-row items-center mb-2">
                      <Icon name="package" size={20} color="#FFFFFF" />
                      <Text className="text-[13px] font-medium ml-2 flex-shrink" style={{ color: '#FFFFFF' }}>Ready for pickup</Text>
                    </View>
                    <Text className="text-white text-[17px] leading-6 font-semibold">{ready > 0 ? 'Your next stop: pickup' : 'All caught up'}</Text>
                    <View className="flex-row items-center mt-3">
                      <Text className="text-white text-sm mr-2">View packages</Text>
                      <Icon name="arrow-right" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text className="text-white text-[44px] font-semibold" style={tabularNums}>{ready.toLocaleString('en-US')}</Text>
                </View>
              </LinearGradient>
            </Pressable>

            <View className="flex-row flex-wrap gap-3 mb-4">
              <Stat value={data?.inTransit ?? 0} label="In transit" icon="truck" color={brand.inTransit} onPress={() => goToTrack('inTransit')} />
              <Stat value={data?.totalShipped ?? 0} label="Total shipped" icon="check-circle" color={brand.totalShipped} onPress={() => goToTrack('totalShipped')} />
            </View>

            <View className="flex-row flex-wrap gap-x-3 gap-y-2 mb-5">
              <QuickAction basis={actionBasis} tone={featureTones.prealerts} icon="bell" label="Pre-alert" onPress={() => navigation.navigate('CreatePrealert')} />
              {deliveryEnabled ? <QuickAction basis={actionBasis} tone={featureTones.delivery} icon="truck" label="Delivery" onPress={() => navigation.navigate('CreateDelivery')} /> : null}
              <QuickAction basis={actionBasis} tone={featureTones.calculator} icon="calculator" label="Calculator" onPress={() => navigation.navigate('Calculator')} />
              <QuickAction basis={actionBasis} tone={featureTones.rates} icon="dollar-sign" label="Rates" onPress={() => navigation.navigate('Rates')} />
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
                className="rounded-[20px] border p-4 mt-2 flex-row items-center active:opacity-70"
                style={{ backgroundColor: colorTones.teal.surface, borderColor: colorTones.teal.border }}
              >
                <View className="w-10 h-10 rounded-xl bg-white items-center justify-center mr-3"><Icon name="users" size={20} color={colorTones.teal.ink} /></View>
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
