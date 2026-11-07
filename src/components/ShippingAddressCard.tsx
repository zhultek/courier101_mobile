import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { ShippingAddress } from '../api/types';
import { useAuth } from '../store/auth';
import { Icon } from './Icon';

function addressKey(address: ShippingAddress) {
  return `${address.address_type}:${address.name}:${address.address}`;
}

export function ShippingAddressSelector({ addresses }: { addresses: ShippingAddress[] }) {
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const selected = addresses.find((address) => addressKey(address) === selectedKey) ?? addresses[0];
  if (!selected) return null;

  return (
    <View>
      {addresses.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 8 }}>
          {addresses.map((address) => {
            const active = addressKey(address) === addressKey(selected);
            return (
              <Pressable
                key={addressKey(address)}
                onPress={() => setSelectedKey(addressKey(address))}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={address.name || (address.address_type === 'cn' ? 'China' : 'United States')}
                className="min-h-[44px] rounded-xl px-4 py-3 border justify-center"
                style={{ backgroundColor: active ? '#EFF6FF' : '#FFFFFF', borderColor: active ? '#2563EB' : '#E2E8F0' }}
              >
                <Text className="text-sm font-semibold" style={{ color: active ? '#1D4ED8' : '#475569' }}>
                  {address.name || (address.address_type === 'cn' ? 'China' : 'United States')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
      <ShippingAddressCard key={addressKey(selected)} address={selected} />
    </View>
  );
}

export function ShippingAddressCard({ address }: { address: ShippingAddress }) {
  const user = useAuth((s) => s.user);
  const [expanded, setExpanded] = React.useState(false);
  const fullName = [address.name_prefix, user?.first_name, user?.last_name, address.name_suffix].filter(Boolean).join(' ');
  const isChina = address.address_type === 'cn';
  const country = address.country || (isChina ? 'China' : 'United States');
  const rows: { label: string; value: string; important?: boolean }[] = [
    { label: 'Name', value: fullName },
    { label: isChina ? 'Street address' : 'Address line one', value: address.address },
  ];
  if (!address.hide_address && address.address2) {
    rows.push({ label: 'Address line two', value: address.address2, important: true });
  }
  if (isChina && address.building) rows.push({ label: 'Unit / building', value: address.building });
  if (isChina) {
    rows.push({ label: 'State / province', value: address.state }, { label: 'City', value: address.city });
  } else {
    rows.push({ label: 'City', value: address.city }, { label: 'State', value: address.state });
  }
  rows.push({ label: 'ZIP / postal code', value: address.zip }, { label: 'Country', value: country });

  return (
    <View className="rounded-[20px] bg-white border border-line p-4 mb-4">
      <View className="flex-row items-start mb-3">
        <View className="w-10 h-10 rounded-xl bg-primary-light items-center justify-center mr-3">
          <Icon name="globe" size={20} color="#2563EB" />
        </View>
        <View className="flex-1 min-w-0">
          <Text className="text-base font-semibold text-ink">{address.name || country}</Text>
          <Text className="text-[13px] text-muted mt-0.5">{country}</Text>
        </View>
      </View>
      <Text className="text-sm font-medium text-ink leading-[22px]">{address.address}</Text>
      <Text className="text-sm text-muted leading-[22px]">{[address.city, address.state, address.zip].filter(Boolean).join(', ')}</Text>
      {!address.hide_address && address.address2 ? (
        <Text className="text-sm font-semibold text-accent-dark leading-[22px] mt-1">{address.address2}</Text>
      ) : null}

      {expanded ? (
        <View className="mt-4 border-t border-line pt-1">
          {rows.map((row) => (
            <View key={row.label} className="py-2">
              <Text className="text-[12px] text-muted mb-0.5">{row.label}</Text>
              <Text className={`text-sm leading-[22px] font-medium ${row.important ? 'text-accent-dark' : 'text-ink'}`}>{row.value || '—'}</Text>
            </View>
          ))}
          {address.note ? <Text className="text-sm text-accent-dark leading-[22px] mt-2">{address.note}</Text> : null}
        </View>
      ) : null}

      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1 mt-3">
        <Pressable onPress={() => setExpanded((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded }} className="min-h-[44px] justify-center px-1">
          <Text className="text-muted text-sm font-medium">{expanded ? 'Hide details' : 'Show full address'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
