import React, { useState } from 'react';
import {Text, View } from 'react-native';
import {
  GradientScreen,
  Field,
  PrimaryButton,
  ScreenHeader,
} from '../../components/ui';
import { useCreateShopForMe } from '../../api/hooks';
import { ApiError, toFormData } from '../../api/client';
import type { AppScreenProps } from '../../navigation/types';
import { confirmAction, notify } from '../../utils/dialogs';

export default function CreateShopForMeScreen({
  navigation,
}: AppScreenProps<'CreateShopForMe'>) {
  const create = useCreateShopForMe();
  const [productName, setProductName] = useState('');
  const [productLink, setProductLink] = useState('');
  const [value, setValue] = useState('');
  const [quantity, setQuantity] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!productName || !productLink || !value || !quantity || !weight) {
      setError('All fields are required.');
      return;
    }
    setError(null);
    create.mutate(
      toFormData({
        product_name: productName,
        product_link: productLink,
        value,
        quantity,
        weight,
      }),
      {
        onSuccess: () => {
          notify('Request sent', 'Your shop-for-me request has been submitted.');
          navigation.goBack();
        },
        onError: (e) =>
          setError(e instanceof ApiError ? e.firstError : 'Unable to submit request.'),
      }
    );
  };

  return (
    <GradientScreen>
      <ScreenHeader title="New request" onBack={() => navigation.goBack()} />
      <View className="mt-4">
        <Field
          icon="shopping-bag"
          placeholder="Product name"
          value={productName}
          onChangeText={setProductName}
        />
        <Field
          icon="link"
          placeholder="Product link"
          autoCapitalize="none"
          keyboardType="url"
          value={productLink}
          onChangeText={setProductLink}
        />
        <Field
          icon="dollar-sign"
          placeholder="Value (USD)"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={setValue}
        />
        <Field
          icon="layers"
          placeholder="Quantity"
          keyboardType="number-pad"
          value={quantity}
          onChangeText={setQuantity}
        />
        <Field
          icon="package"
          placeholder="Weight (lbs)"
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        {error ? <Text className="font-normal text-danger text-center mb-4">{error}</Text> : null}
        <PrimaryButton title="Submit request" onPress={submit} loading={create.isPending} />
      </View>
    </GradientScreen>
  );
}
