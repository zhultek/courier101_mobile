import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { GradientScreen, Field, PrimaryButton } from '../../components/ui';
import { useCourierLookup } from '../../api/hooks';
import { ApiError } from '../../api/client';

export default function CourierCodeScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const lookup = useCourierLookup();

  const submit = () => {
    if (!code.trim()) {
      setError('Please enter your courier code');
      return;
    }
    setError(null);
    lookup.mutate(code.trim(), {
      onError: (e) =>
        setError(e instanceof ApiError ? e.firstError : 'Something went wrong. Try again.'),
    });
  };

  return (
    <GradientScreen>
      <Image
        source={require('../../../assets/logo.png')}
        className="w-48 h-20 mt-6"
        resizeMode="contain"
      />
      <View className="mt-24 mb-10">
        <Text className="text-4xl font-extrabold text-ink leading-tight">
          Ship anywhere.{'\n'}Track everything.
        </Text>
        <View className="w-12 h-1.5 rounded-full bg-accent mt-4 mb-4" />
        <Text className="font-normal text-muted text-base">
          Enter your courier code to continue
        </Text>
      </View>
      <Field
        icon="hash"
        placeholder="Courier code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
        autoCorrect={false}
        error={error ?? undefined}
        onSubmitEditing={submit}
        returnKeyType="go"
      />
      <PrimaryButton title="Continue" onPress={submit} loading={lookup.isPending} />
    </GradientScreen>
  );
}
