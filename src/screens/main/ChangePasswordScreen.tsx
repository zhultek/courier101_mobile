import React, { useState } from 'react';
import {Text, View } from 'react-native';
import {
  GradientScreen,
  PasswordField,
  PrimaryButton,
  ScreenHeader,
} from '../../components/ui';
import { useUpdatePassword } from '../../api/hooks';
import { ApiError } from '../../api/client';
import type { AppScreenProps } from '../../navigation/types';
import { confirmAction, notify } from '../../utils/dialogs';

export default function ChangePasswordScreen({
  navigation,
}: AppScreenProps<'ChangePassword'>) {
  const update = useUpdatePassword();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    update.mutate(
      {
        current_password: current,
        password,
        password_confirmation: confirmation,
      },
      {
        onSuccess: () => {
          notify('Password updated', 'Your password has been changed.');
          navigation.goBack();
        },
        onError: (e) =>
          setError(e instanceof ApiError ? e.firstError : 'Unable to update password.'),
      }
    );
  };

  return (
    <GradientScreen>
      <ScreenHeader title="Change password" onBack={() => navigation.goBack()} />
      <View className="mt-4">
        <PasswordField
          placeholder="Current password"
          value={current}
          onChangeText={setCurrent}
        />
        <PasswordField
          placeholder="New password"
          value={password}
          onChangeText={setPassword}
        />
        <PasswordField
          placeholder="Confirm new password"
          value={confirmation}
          onChangeText={setConfirmation}
        />
        {error ? <Text className="font-normal text-danger text-center mb-4">{error}</Text> : null}
        <PrimaryButton title="Update password" onPress={submit} loading={update.isPending} />
      </View>
    </GradientScreen>
  );
}
