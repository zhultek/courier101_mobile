import React, { useState } from 'react';
import {Pressable, Text, View } from 'react-native';
import { Icon, IconName } from '../../components/Icon';
import * as ImagePicker from 'expo-image-picker';
import {
  GradientScreen,
  Field,
  PrimaryButton,
  ScreenHeader,
} from '../../components/ui';
import { useCreatePrealert } from '../../api/hooks';
import { ApiError, toFormData } from '../../api/client';
import type { AppScreenProps } from '../../navigation/types';
import { confirmAction, notify } from '../../utils/dialogs';

export default function CreatePrealertScreen({
  navigation,
  route,
}: AppScreenProps<'CreatePrealert'>) {
  const create = useCreatePrealert();
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState(
    route.params?.trackingNumber ?? ''
  );
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [invoice, setInvoice] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickInvoice = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });
    if (!result.canceled) setInvoice(result.assets[0]);
  };

  const submit = () => {
    if (!carrier || !trackingNumber || !description || !value) {
      setError('All fields are required');
      return;
    }
    if (!invoice) {
      setError('Please attach the invoice for this package');
      return;
    }
    setError(null);
    const form = toFormData({
      carrier,
      tracking_number: trackingNumber,
      description,
      value,
    });
    if (invoice) {
      form.append('invoice[]', {
        uri: invoice.uri,
        name: invoice.fileName ?? 'invoice.jpg',
        type: invoice.mimeType ?? 'image/jpeg',
      } as any);
    }
    create.mutate(form, {
      onSuccess: () => {
        notify('Prealert created', 'Your prealert has been submitted.');
        navigation.goBack();
      },
      onError: (e) =>
        setError(e instanceof ApiError ? e.firstError : 'Unable to create prealert.'),
    });
  };

  return (
    <GradientScreen>
      <ScreenHeader title="New prealert" onBack={() => navigation.goBack()} />
      <View className="mt-4">
        <Field
          icon="truck"
          placeholder="Carrier (e.g. Amazon, DHL)"
          value={carrier}
          onChangeText={setCarrier}
        />
        <Field
          icon="hash"
          placeholder="Tracking number"
          autoCapitalize="none"
          value={trackingNumber}
          onChangeText={setTrackingNumber}
        />
        <Field
          icon="file-text"
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
        />
        <Field
          icon="dollar-sign"
          placeholder="Value (USD)"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={setValue}
        />
        <Pressable
          onPress={pickInvoice}
          className={`flex-row items-center rounded-2xl px-4 py-4 mb-4 border ${
            invoice ? 'bg-primary-light border-primary/30' : 'bg-white border-line border-dashed'
          }`}
        >
          <Icon name="paperclip" size={20} color={invoice ? '#2563EB' : '#94A3B8'} />
          <Text
            className={`flex-1 px-3 text-base ${
              invoice ? 'font-medium text-ink' : 'font-normal text-faint'
            }`}
          >
            {invoice ? invoice.fileName ?? 'Invoice attached' : 'Attach invoice'}
          </Text>
          {invoice ? <Icon name="check" size={20} color="#2563EB" /> : null}
        </Pressable>
        {error ? <Text className="font-normal text-danger text-center mb-4">{error}</Text> : null}
        <PrimaryButton title="Submit prealert" onPress={submit} loading={create.isPending} />
      </View>
    </GradientScreen>
  );
}
