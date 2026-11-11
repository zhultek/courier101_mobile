import { useBranding } from '../theme/BrandingProvider';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from './Icon';
import type { Item } from '../api/types';
import { money, tabularNums } from './ui';
import { packageTones } from '../theme/colors';

/** Avoid timezone drift for API dates formatted as YYYY-MM-DD. */
function shortDate(value: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

export function ItemCard({
  item,
  onPress,
  onInvoicePress,
  showPrice = true,
  statusLabel,
  statusTone = 'primary',
}: {
  item: Item;
  onPress?: () => void;
  onInvoicePress?: () => void;
  showPrice?: boolean;
  statusLabel?: string;
  statusTone?: 'primary' | 'success' | 'accent';
}) {
  const brand = useBranding();
  const created = shortDate(item.created_at);
  const title = item.description || item.sender || 'Package';
  const tone = packageTones[statusTone];
  const status = statusLabel || item.location || item.status;

  return (
    <View className="rounded-[20px] bg-white border border-line mb-3 overflow-hidden">
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `View package: ${title}, ${item.tracking_number}` : undefined}
        className="p-4 active:opacity-75"
      >
        <View className="flex-row items-start">
          <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: tone.surface }}>
            <Icon name="package" size={21} color={tone.ink} />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-base font-semibold text-ink leading-[23px]">{title}</Text>
            {item.description && item.sender ? (
              <Text className="text-sm text-muted mt-0.5">{item.sender}</Text>
            ) : null}
          </View>
          {onPress ? <Icon name="chevron-right" size={17} color="#64748B" style={{ marginLeft: 8, marginTop: 3 }} /> : null}
        </View>

        {status ? (
          <View className="self-start rounded-lg px-2.5 py-1.5 mt-3" style={{ backgroundColor: tone.surface, maxWidth: '100%' }}>
            <Text className="text-[13px] font-semibold" style={{ color: tone.ink }}>{status}</Text>
          </View>
        ) : null}

        <Text className="text-[12px] text-muted mt-3 mb-1">Tracking number</Text>
        <Text className="text-sm text-ink leading-5" style={tabularNums}>{item.tracking_number || 'Not available'}</Text>
        {item.warehouse_code ? (
          <Text className="text-[13px] text-muted leading-5 mt-1">Warehouse {item.warehouse_code}</Text>
        ) : null}
        {!showPrice && item.location && item.location !== status ? (
          <Text className="text-sm text-muted mt-2">{item.location}</Text>
        ) : null}
        {!showPrice && created ? (
          <Text className="text-[13px] text-muted mt-2">Created {created}</Text>
        ) : null}
      </Pressable>

      <View className="flex-row flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 border-t border-line">
        <View style={{ flexGrow: 1, flexBasis: 72 }}>
          <Text className="text-[12px] text-muted mb-1">Weight</Text>
          <Text className="text-sm font-medium text-ink" style={tabularNums}>{item.weight ? `${item.weight} lbs` : '—'}</Text>
        </View>
        {showPrice ? (
          <View style={{ flexGrow: 1, flexBasis: 88 }}>
            <Text className="text-[12px] text-muted mb-1">Total</Text>
            <Text className="text-base font-semibold text-ink" style={tabularNums}>{money(item.total)}</Text>
          </View>
        ) : null}
        {onInvoicePress ? (
          <Pressable
            onPress={onInvoicePress}
            accessibilityRole="button"
            accessibilityLabel={`View invoice for ${item.tracking_number}`}
            className="flex-row items-center justify-center min-h-[44px] rounded-xl bg-primary-light px-3 active:bg-primary-soft"
          >
            <Icon name="file-text" size={17} color={brand.primary} />
            <Text className="text-primary font-semibold text-sm ml-1.5">Invoice</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
