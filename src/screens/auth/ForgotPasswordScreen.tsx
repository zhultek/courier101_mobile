import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { GradientScreen, Field, PrimaryButton, ScreenHeader } from '../../components/ui';
import { useForgotPassword } from '../../api/hooks';
import { ApiError } from '../../api/client';
import type { AuthScreenProps } from '../../navigation/types';

export default function ForgotPasswordScreen({
  navigation,
}: AuthScreenProps<'ForgotPassword'>) {
  const forgot = useForgotPassword();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!email.trim()) {
      setError('Enter your email address');
      return;
    }
    setError(null);
    forgot.mutate(email.trim(), {
      onSuccess: () => setSent(true),
      onError: (e) =>
        setError(e instanceof ApiError ? e.firstError : 'Something went wrong. Try again.'),
    });
  };

  return (
    <GradientScreen>
      <ScreenHeader title="Forgot Password" onBack={() => navigation.goBack()} />
      <View className="mt-8 mb-8">
        <Text className="text-4xl font-extrabold text-ink">Reset password</Text>
        <View className="w-12 h-1.5 rounded-full bg-accent mt-4 mb-4" />
        <Text className="font-normal text-muted text-base">
          Enter your email and we will send you a reset link.
        </Text>
      </View>
      {sent ? (
        <Text className="font-normal text-ink text-base mb-6">
          If an account exists for {email}, a password reset link is on its way. Check
          your inbox.
        </Text>
      ) : (
        <>
          <Field
            icon="mail"
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            error={error ?? undefined}
          />
          <PrimaryButton title="Send reset link" onPress={submit} loading={forgot.isPending} />
        </>
      )}
    </GradientScreen>
  );
}
