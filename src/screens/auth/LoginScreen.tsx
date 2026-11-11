import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon, IconName } from '../../components/Icon';
import { GradientScreen, Field, PasswordField, PrimaryButton } from '../../components/ui';
import { useLogin } from '../../api/hooks';
import { ApiError } from '../../api/client';
import { useAuth } from '../../store/auth';
import type { AuthScreenProps } from '../../navigation/types';

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const login = useLogin();
  const courier = useAuth((s) => s.courier);
  const logoUrl = courier?.logo_url;
  const clearCourier = useAuth((s) => s.clearCourier);
  const [serverError, setServerError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    login.mutate(values, {
      onError: (e) =>
        setServerError(
          e instanceof ApiError ? e.firstError : 'Unable to sign in. Try again.'
        ),
    });
  });

  return (
    <GradientScreen>
      <View className="items-center mt-8">
        <Image
          source={
            logoUrl
              ? { uri: logoUrl }
              : require('../../../assets/logo.png')
          }
          style={{ width: 176, height: 64, backgroundColor: 'transparent' }}
          resizeMode="contain"
        />
      </View>

      <View className="mt-12 mb-8">
        <Text className="text-4xl font-extrabold text-ink">Welcome back</Text>
        <View className="w-12 h-1.5 rounded-full bg-accent mt-4 mb-4" />
        <Text className="font-normal text-muted text-base">
          Sign in to manage your packages
        </Text>
      </View>

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
            returnKeyType="next"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <PasswordField
            label="Password"
            placeholder="Your password"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      <Pressable
        onPress={() => navigation.navigate('ForgotPassword')}
        hitSlop={8}
        className="self-end mb-6"
      >
        <Text className="text-primary font-semibold">Forgot password?</Text>
      </Pressable>

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

      <PrimaryButton title="Sign in" onPress={onSubmit} loading={login.isPending} />

      <View className="flex-row items-center mt-10 mb-6">
        <View className="flex-1 h-px bg-line" />
        <Text className="font-normal text-faint text-[13px] mx-3">New here?</Text>
        <View className="flex-1 h-px bg-line" />
      </View>

      <Pressable
        onPress={() => navigation.navigate('Register')}
        className="rounded-full border-[1.5px] border-primary py-4 items-center active:bg-primary-light"
      >
        <Text className="text-primary text-base font-semibold">Create an account</Text>
      </Pressable>

      <Pressable
        onPress={clearCourier}
        hitSlop={8}
        className="mt-8 self-center flex-row items-center"
      >
        <Icon name="refresh-ccw" size={14} color="#64748B" />
        <Text className="font-normal text-muted ml-1.5 underline">Change courier code</Text>
      </Pressable>
    </GradientScreen>
  );
}
