import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon, IconName } from '../../components/Icon';
import {
  GradientScreen,
  Field,
  PasswordField,
  PrimaryButton,
  SelectField,
  SectionLabel,
  cardShadow,
} from '../../components/ui';
import { useRegister } from '../../api/hooks';
import { ApiError } from '../../api/client';
import { PARISHES } from '../../config';
import type { AuthScreenProps } from '../../navigation/types';

const schema = z
  .object({
    full_name: z.string().trim().min(3, 'Enter your full name'),
    email: z.email('Enter a valid email address'),
    mobile: z.string().min(7, 'Enter a valid phone number').max(12),
    street_address: z.string().optional(),
    city: z.string().optional(),
    parish: z.string().optional(),
    trn: z.string().max(9, 'TRN must be 9 digits or less').optional(),
    referral_code: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const register = useRegister();
  const [serverError, setServerError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      email: '',
      mobile: '',
      street_address: '',
      city: '',
      parish: '',
      trn: '',
      referral_code: '',
      password: '',
      password_confirmation: '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    const [first_name, ...rest] = values.full_name.trim().split(/\s+/);
    register.mutate(
      {
        first_name,
        last_name: rest.join(' ') || first_name,
        email: values.email,
        mobile: values.mobile,
        street_address: values.street_address,
        city: values.city,
        parish: values.parish,
        trn: values.trn,
        password: values.password,
        password_confirmation: values.password_confirmation,
      },
      {
        onError: (e) =>
          setServerError(
            e instanceof ApiError ? e.firstError : 'Unable to register. Try again.'
          ),
      }
    );
  });

  return (
    <GradientScreen>
      <View className="flex-row items-center pt-2">
        <Pressable
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
          accessibilityLabel="Back to sign in"
          className="w-11 h-11 rounded-2xl bg-white border border-line items-center justify-center active:bg-surface"
          style={cardShadow}
        >
          <Icon name="arrow-left" size={20} color="#0F172A" />
        </Pressable>
      </View>

      <View className="mt-8 mb-8">
        <Text className="text-4xl font-extrabold text-ink">Create account</Text>
        <View className="w-12 h-1.5 rounded-full bg-accent mt-4 mb-4" />
        <Text className="font-normal text-muted text-base">
          Just a few details to get started
        </Text>
      </View>

      <SectionLabel title="Your details" />
      <Controller
        control={control}
        name="full_name"
        render={({ field, fieldState }) => (
          <Field
            label="Full name"
            icon="user"
            placeholder="Jane Brown"
            autoComplete="name"
            textContentType="name"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <Field
            label="Email"
            icon="mail"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="mobile"
        render={({ field, fieldState }) => (
          <Field
            label="Phone number"
            icon="phone"
            placeholder="876-555-0123"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      <SectionLabel title="Delivery address" className="mt-4" />
      <Controller
        control={control}
        name="street_address"
        render={({ field, fieldState }) => (
          <Field
            label="Street address"
            icon="home"
            placeholder="12 Main Street"
            autoComplete="street-address"
            textContentType="fullStreetAddress"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <View className="flex-row gap-3">
        <Controller
          control={control}
          name="city"
          render={({ field }) => (
            <SelectField
              label="City"
              icon="map"
              placeholder="Select"
              compact
              value={field.value}
              options={PARISHES.map((p) => ({ label: p, value: p }))}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="parish"
          render={({ field }) => (
            <SelectField
              label="Parish"
              icon="globe"
              placeholder="Select"
              compact
              value={field.value}
              options={PARISHES.map((p) => ({ label: p, value: p }))}
              onChange={field.onChange}
            />
          )}
        />
      </View>
      <Controller
        control={control}
        name="trn"
        render={({ field, fieldState }) => (
          <Field
            label="TRN (optional)"
            icon="credit-card"
            placeholder="9 digits"
            keyboardType="number-pad"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="referral_code"
        render={({ field }) => (
          <Field
            label="Referral code (optional)"
            icon="link"
            placeholder="Have a code? Enter it here"
            autoCapitalize="none"
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />

      <SectionLabel title="Security" className="mt-4" />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <PasswordField
            label="Password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            textContentType="newPassword"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password_confirmation"
        render={({ field, fieldState }) => (
          <PasswordField
            label="Confirm password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            textContentType="newPassword"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      {serverError ? (
        <View
          accessibilityRole="alert"
          className="flex-row items-center rounded-2xl bg-danger-light px-4 py-3.5 mb-5"
        >
          <Icon name="alert-circle" size={18} color="#DC2626" />
          <Text className="flex-1 ml-2.5 font-medium text-danger text-sm">
            {serverError}
          </Text>
        </View>
      ) : null}

      <PrimaryButton
        title="Create my account"
        onPress={onSubmit}
        loading={register.isPending}
        className="mt-2"
      />

      <View className="flex-row justify-center mt-8">
        <Text className="font-normal text-muted">Already have an account? </Text>
        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <Text className="text-primary font-bold">Sign in</Text>
        </Pressable>
      </View>
    </GradientScreen>
  );
}
