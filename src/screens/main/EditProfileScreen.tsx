import React, { useState } from 'react';
import { QueryError } from '../../components/QueryContent';
import {Text, View } from 'react-native';
import {
  GradientScreen,
  Field,
  PrimaryButton,
  ScreenHeader,
  SelectField,
} from '../../components/ui';
import { useProfile, useUpdateProfile } from '../../api/hooks';
import { ApiError } from '../../api/client';
import { useAuth } from '../../store/auth';
import { PARISHES } from '../../config';
import type { AppScreenProps } from '../../navigation/types';
import { confirmAction, notify } from '../../utils/dialogs';

export default function EditProfileScreen({
  navigation,
}: AppScreenProps<'EditProfile'>) {
  const storedUser = useAuth((s) => s.user);
  const profile = useProfile();
  const user = profile.data?.data ?? storedUser;
  const update = useUpdateProfile();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [mobile, setMobile] = useState(user?.mobile_cell ?? '');
  const [streetAddress, setStreetAddress] = useState(user?.street_address ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [parish, setParish] = useState(user?.parish ?? '');
  const [trn, setTrn] = useState(user?.trn ?? '');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    update.mutate(
      {
        first_name: firstName,
        last_name: lastName,
        email,
        mobile,
        street_address: streetAddress,
        city,
        parish,
        trn,
      },
      {
        onSuccess: () => {
          notify('Profile updated', 'Your changes have been saved.');
          navigation.goBack();
        },
        onError: (e) =>
          setError(e instanceof ApiError ? e.firstError : 'Unable to update profile.'),
      }
    );
  };

  return (
    <GradientScreen>
      <ScreenHeader title="Edit profile" onBack={() => navigation.goBack()} />
      {profile.isError || profile.fetchStatus === 'paused' ? <QueryError query={profile} resource="your profile" /> : null}
      <View className="mt-4">
        <Field icon="user" placeholder="First name" value={firstName} onChangeText={setFirstName} />
        <Field icon="user" placeholder="Last name" value={lastName} onChangeText={setLastName} />
        <Field
          icon="mail"
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          icon="phone"
          placeholder="Phone number"
          keyboardType="phone-pad"
          value={mobile ?? ''}
          onChangeText={setMobile}
        />
        <Field
          icon="home"
          placeholder="Street address"
          value={streetAddress ?? ''}
          onChangeText={setStreetAddress}
        />
        <Field icon="map" placeholder="City" value={city ?? ''} onChangeText={setCity} />
        <SelectField
          icon="globe"
          placeholder="Parish"
          value={parish ?? ''}
          options={PARISHES.map((p) => ({ label: p, value: p }))}
          onChange={setParish}
        />
        <Field
          icon="credit-card"
          placeholder="TRN"
          value={trn ?? ''}
          onChangeText={setTrn}
        />
        {error ? <Text className="font-normal text-danger text-center mb-4">{error}</Text> : null}
        <PrimaryButton title="Save changes" onPress={submit} loading={update.isPending} />
      </View>
    </GradientScreen>
  );
}
