import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from './Icon';
import type { Item } from '../api/types';
import { cardShadow, money, tabularNums } from './ui';

/** created_at arrives as "YYYY-MM-DD ..." — render DD/MM/YYYY without Date() timezone drift. */
function shortDate(value: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 pr-2">
      <Text className="text-[13px] text-muted">{label}</Text>
      <Text
        className="text-[15px] font-bold text-ink mt-0.5"
        style={tabularNums}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

export function ItemCard({
  item,
  onPress,
  onInvoicePress,
  showPrice = true,
}: {
  item: Item;
  onPress?: () => void;
  onInvoicePress?: () => void;
  showPrice?: boolean;
}) {
  const created = shortDate(item.created_at);
  const metas: { label: string; value: string }[] = [
    showPrice
      ? { label: 'Price', value: money(item.total) }
      : { label: 'Location', value: item.location || '-' },
    { label: 'Weight', value: item.weight ? `${item.weight} lbs` : '-' },
    { label: 'Sender', value: item.sender || '-' },
  ];
  // Ready items are about pickup, not history — only shipped/transit show the date.
  if (!showPrice && created) metas.push({ label: 'Created', value: created });

  const rows: (typeof metas)[] = [];
  for (let i = 0; i < metas.length; i += 2) rows.push(metas.slice(i, i + 2));

  return (
    <Pressable onPress={onPress} disabled={!onPress} className={onPress ? 'active:opacity-80' : ''}>
      <View className="rounded-[22px] bg-white/60 p-2 mb-3.5" style={cardShadow}>
        <View className="flex-row items-center px-1.5 py-1.5">
          <View className="w-11 h-11 rounded-full bg-primary-soft items-center justify-center">
            <Icon name="package" size={20} color="#2563EB" />
          </View>
          <View className="flex-1 px-3">
            <Text
              className="text-[16px] font-bold text-ink"
              style={tabularNums}
              numberOfLines={1}
            >
              {item.tracking_number}
            </Text>
            <Text className="text-[13px] font-semibold text-success" numberOfLines={1}>
              {item.warehouse_code}
            </Text>
          </View>
          {onInvoicePress ? (
            <Pressable
              onPress={onInvoicePress}
              hitSlop={6}
              className="w-10 h-10 rounded-full bg-white items-center justify-center active:bg-surface"
              style={cardShadow}
            >
              <Icon name="file-text" size={18} color="#0F172A" />
            </Pressable>
          ) : null}
        </View>

        <View className="rounded-[16px] bg-white px-4 py-3">
          {rows.map((row, i) => (
            <View key={i} className={`flex-row ${i > 0 ? 'mt-2.5' : ''}`}>
              {row.map((meta) => (
                <Meta key={meta.label} label={meta.label} value={meta.value} />
              ))}
              {row.length === 1 ? <View className="flex-1 pr-2" /> : null}
            </View>
          ))}
          {item.description ? (
            <View className="mt-2.5">
              <Meta label="Description" value={item.description} />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
