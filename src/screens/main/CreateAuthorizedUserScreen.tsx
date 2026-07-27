import React, { useState } from 'react';
import {Text, View } from 'react-native';
import {
  GradientScreen,
  Field,
  PrimaryButton,
  ScreenHeader,
  SelectField,
} from '../../components/ui';
import { useAuthorizedUserTypes, useCreateAuthorizedUser } from '../../api/hooks';
import { ApiError } from '../../api/client';
import type { AppScreenProps } from '../../navigation/types';
import { confirmAction, notify } from '../../utils/dialogs';

export default function CreateAuthorizedUserScreen({
  navigation,
}: AppScreenProps<'CreateAuthorizedUser'>) {
  const types = useAuthorizedUserTypes();
  const create = useCreateAuthorizedUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!firstName || !lastName || !idType || !idNumber) {
      setError('All fields are required.');
      return;
    }
    setError(null);
    create.mutate(
      { first_name: firstName, last_name: lastName, id_type: idType, id_number: idNumber },
      {
        onSuccess: () => {
          notify('Authorized user added', `${firstName} can now collect your packages.`);
          navigation.goBack();
        },
        onError: (e) =>
          setError(e instanceof ApiError ? e.firstError : 'Unable to add authorized user.'),
      }
    );
  };

  return (
    <GradientScreen>
      <ScreenHeader title="Add authorized user" onBack={() => navigation.goBack()} />
      <View className="mt-4">
        <Field icon="user" placeholder="First name" value={firstName} onChangeText={setFirstName} />
        <Field icon="user" placeholder="Last name" value={lastName} onChangeText={setLastName} />
        <SelectField
          icon="credit-card"
          placeholder="ID type"
          value={idType}
          options={(types.data ?? []).map((t) => ({ label: t.name, value: t.id }))}
          onChange={setIdType}
        />
        <Field
          icon="hash"
          placeholder="ID number"
          keyboardType="number-pad"
          value={idNumber}
          onChangeText={setIdNumber}
        />
        {error ? <Text className="font-normal text-danger text-center mb-4">{error}</Text> : null}
        <PrimaryButton title="Add user" onPress={submit} loading={create.isPending} />
      </View>
    </GradientScreen>
  );
}
