import React from 'react';
import { Text, View } from 'react-native';
import type { ShippingAddress } from '../api/types';
import { useAuth } from '../store/auth';
import { Card } from './ui';

function Row({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View className={`px-4 py-3 ${last ? '' : 'border-b border-line'}`}>
      <Text className="text-muted text-[13px] font-medium mb-1">{label}</Text>
      {children}
    </View>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return <Text className="text-ink text-sm font-semibold">{children}</Text>;
}

function RedValue({ children }: { children: React.ReactNode }) {
  return <Text className="text-danger text-sm font-bold">{children}</Text>;
}

/**
 * Mirrors the web dashboard's shipping address tables:
 * - us: Name / Address Line One / Address Line Two (red) / City / State / Zip
 * - cn: Name / Street Address / Address Line Two (red) / Unit/Building /
 *       State/Province / City / Zip
 */
export function ShippingAddressCard({ address }: { address: ShippingAddress }) {
  const user = useAuth((s) => s.user);
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();
  const isChina = address.address_type === 'cn';

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Name',
      value: (
        <Text className="font-normal text-sm">
          {address.name_prefix ? <RedValue>{address.name_prefix} </RedValue> : null}
          <Value>{fullName}</Value>
          {address.name_suffix ? <RedValue> {address.name_suffix}</RedValue> : null}
        </Text>
      ),
    },
    {
      label: isChina ? 'Street Address' : 'Address Line One',
      value: <Value>{address.address}</Value>,
    },
  ];

  if (!address.hide_address) {
    rows.push({
      label: 'Address Line Two',
      value: <RedValue>{address.address2}</RedValue>,
    });
  }

  if (isChina) {
    if (address.building) {
      rows.push({ label: 'Unit/Building', value: <Value>{address.building}</Value> });
    }
    rows.push(
      { label: 'State/Province', value: <Value>{address.state}</Value> },
      { label: 'City', value: <Value>{address.city}</Value> },
      { label: 'Zip', value: <Value>{address.zip}</Value> }
    );
  } else {
    rows.push(
      { label: 'City', value: <Value>{address.city}</Value> },
      { label: 'State', value: <Value>{address.state}</Value> },
      { label: 'Zip', value: <Value>{address.zip}</Value> }
    );
  }

  return (
    <Card className="mb-4 p-0 overflow-hidden">
      <View className="px-4 py-3 bg-surface border-b border-line">
        <Text className="text-ink font-bold text-base">{address.name}</Text>
      </View>
      <View className="m-3 rounded-xl border border-line overflow-hidden">
        {rows.map((row, index) => (
          <Row key={row.label} label={row.label} last={index === rows.length - 1}>
            {row.value}
          </Row>
        ))}
      </View>
      {address.note ? (
        <Text className="font-normal text-danger text-[13px] leading-[18px] px-4 pb-3">
          * {address.note}
        </Text>
      ) : null}
    </Card>
  );
}
