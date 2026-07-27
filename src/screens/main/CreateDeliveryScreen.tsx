import React, { useState } from 'react';
import {Pressable, Text, View } from 'react-native';
import { Icon, IconName } from '../../components/Icon';
import {
  GradientScreen,
  Field,
  PrimaryButton,
  ScreenHeader,
  SelectField,
  LoadingView,
  money,
  tabularNums,
} from '../../components/ui';
import {
  useCreateDelivery,
  useDeliveryLocations,
  useTrack,
} from '../../api/hooks';
import { ApiError, toFormData } from '../../api/client';
import { PARISHES } from '../../config';
import type { AppScreenProps } from '../../navigation/types';
import { confirmAction, notify } from '../../utils/dialogs';

export default function CreateDeliveryScreen({
  navigation,
}: AppScreenProps<'CreateDelivery'>) {
  const create = useCreateDelivery();
  const locations = useDeliveryLocations();
  const track = useTrack();

  const [location, setLocation] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [parish, setParish] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [instruction, setInstruction] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pickupItems = track.data?.readyForPickup ?? [];
  const selectedLocation = locations.data?.data.find(
    (l) => String(l.id) === location
  );

  const toggleItem = (id: number) =>
    setSelectedItems((current) =>
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id]
    );

  const submit = () => {
    if (!location || !deliveryDate || !selectedItems.length) {
      setError('Pick a location, delivery date and at least one package.');
      return;
    }
    setError(null);
    const form = toFormData({
      location,
      delivery_date: deliveryDate,
      parish,
      house_number: houseNumber,
      street_address: streetAddress,
      instruction,
      'items[]': JSON.stringify(selectedItems.map(String)),
    });
    create.mutate(form, {
      onSuccess: () => {
        notify('Delivery requested', 'Your delivery request has been submitted.');
        navigation.goBack();
      },
      onError: (e) =>
        setError(e instanceof ApiError ? e.firstError : 'Unable to request delivery.'),
    });
  };

  return (
    <GradientScreen>
      <ScreenHeader title="Request delivery" onBack={() => navigation.goBack()} />
      <View className="mt-4">
        <SelectField
          icon="map-pin"
          placeholder="Delivery location"
          value={location}
          options={(locations.data?.data ?? []).map((l) => ({
            label: l.name,
            value: String(l.id),
          }))}
          onChange={setLocation}
        />
        {selectedLocation?.delivery_days?.length ? (
          <Text className="font-normal text-muted mb-2 ml-4 -mt-2">
            Delivers on: {selectedLocation.delivery_days.join(', ')}
          </Text>
        ) : null}
        <Field
          icon="calendar"
          placeholder="Delivery date (MM/DD/YYYY)"
          value={deliveryDate}
          onChangeText={setDeliveryDate}
        />
        <SelectField
          icon="globe"
          placeholder="Parish"
          value={parish}
          options={PARISHES.map((p) => ({ label: p, value: p }))}
          onChange={setParish}
        />
        <Field
          icon="home"
          placeholder="House / apt number"
          value={houseNumber}
          onChangeText={setHouseNumber}
        />
        <Field
          icon="map"
          placeholder="Street address"
          value={streetAddress}
          onChangeText={setStreetAddress}
        />
        <Field
          icon="message-square"
          placeholder="Instruction (e.g. leave at the gate)"
          value={instruction}
          onChangeText={setInstruction}
        />

        <Text className="text-lg font-semibold text-ink mb-2">Select packages</Text>
        {track.isLoading ? (
          <LoadingView />
        ) : pickupItems.length ? (
          pickupItems.map((item) => {
            const selected = selectedItems.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => toggleItem(item.id)}
                className={`flex-row items-center rounded-2xl px-4 py-3 mb-2 border ${
                  selected ? 'bg-primary-light border-primary' : 'bg-white border-line'
                }`}
              >
                <Icon
                  name={selected ? 'check-circle' : 'circle'}
                  size={20}
                  color={selected ? '#2563EB' : '#94A3B8'}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-ink font-semibold">{item.warehouse_code}</Text>
                  <Text className="font-normal text-muted" numberOfLines={1}>
                    {item.description}
                  </Text>
                </View>
                <Text className="text-ink font-semibold" style={tabularNums}>
                  {money(item.total)}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <Text className="font-normal text-muted mb-4">No packages ready for pickup.</Text>
        )}

        {error ? <Text className="font-normal text-danger text-center my-4">{error}</Text> : null}
        <PrimaryButton
          title="Request delivery"
          onPress={submit}
          loading={create.isPending}
          className="mt-4"
        />
      </View>
    </GradientScreen>
  );
}
