import { useBranding, useBrandingStyle } from '../theme/BrandingProvider';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from './Icon';
import { useUi } from '../store/ui';
import { colorTones, packageTones, type ColorTone } from '../theme/colors';

/**
 * Split an amount into sign / comma-grouped dollars / cents.
 * Accepts numbers or numeric strings, including ones already carrying
 * "$"/"," decorations (the calculator API returns pre-formatted strings).
 */
export function moneyParts(value: number | string | null | undefined): {
  sign: string;
  dollars: string;
  cents: string;
} {
  const n =
    typeof value === 'string'
      ? Number(value.replace(/[^0-9.-]/g, ''))
      : Number(value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  const [dollars, cents] = Math.abs(safe).toFixed(2).split('.');
  return {
    sign: safe < 0 ? '-' : '',
    dollars: dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    cents,
  };
}

/** Format a numeric (or numeric-string) amount as $X,XXX.XX. */
export function money(value: number | string | null | undefined): string {
  const { sign, dollars, cents } = moneyParts(value);
  return `${sign}$${dollars}.${cents}`;
}

/** Lining tabular figures so amounts align and don't wobble. */
export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

// boxShadow (RN 0.76+) instead of the deprecated shadow* props: on the New
// Architecture, toggling shadow* forces the native view to be recreated,
// which blurs any focused TextInput inside it.
export const cardShadow: ViewStyle = {
  boxShadow:
    '0px 2px 6px rgba(15, 23, 42, 0.035)',
};

export const buttonShadow: ViewStyle = {
  boxShadow:
    '0px 2px 6px rgba(37, 99, 235, 0.16)',
};

export const heroShadow: ViewStyle = {
  boxShadow:
    '0px 2px 4px rgba(11, 22, 51, 0.18), 0px 14px 32px rgba(11, 22, 51, 0.32)',
};

export function GradientScreen({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const brand = useBranding();
  return (
    <LinearGradient
      colors={[brand.canvas, brand.canvasEnd, brand.canvasEnd]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.55 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {scroll ? (
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              className="flex-1 px-5"
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          <View className="flex-1 px-5">{children}</View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

interface FieldProps extends TextInputProps {
  icon?: IconName;
  error?: string;
  label?: string;
}

// Focus/error styling on fields must go through `style`, never through a
// conditional className: NativeWind v4 remounts the subtree when the class
// string changes, which blurs the TextInput the instant it gains focus.
const fieldStateStyle = {
  idle: { borderColor: 'transparent', backgroundColor: '#F1F5F9' },
  focused: { borderColor: '#2563EB', backgroundColor: '#FFFFFF' },
  error: { borderColor: '#DC2626', backgroundColor: '#FFFFFF' },
} as const;

export function Field({ icon, error, label, onFocus, onBlur, ...props }: FieldProps) {
  const brand = useBranding();
  const [focused, setFocused] = useState(false);
  const state = error ? 'error' : focused ? 'focused' : 'idle';
  return (
    <View className="mb-4">
      {label ? (
        <Text className="font-semibold text-ink text-sm mb-1.5 ml-1">{label}</Text>
      ) : null}
      <View
        className="flex-row items-center rounded-2xl px-4 py-1 border-[1.5px]"
        style={[fieldStateStyle[state], focused && !error ? { borderColor: brand.primary } : null, focused ? cardShadow : null]}
      >
        {icon ? (
          <Icon name={icon} size={20} color={focused ? brand.primary : '#94A3B8'} />
        ) : null}
        <TextInput
          className="flex-1 py-3.5 px-3 text-base font-normal text-ink"
          placeholderTextColor="#94A3B8"
          {...props}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
      </View>
      {error ? (
        <Text className="mt-1.5 ml-1 text-[13px] font-medium text-danger">{error}</Text>
      ) : null}
    </View>
  );
}

export function PasswordField({
  icon = 'lock',
  error,
  label,
  onFocus,
  onBlur,
  ...props
}: FieldProps) {
  const brand = useBranding();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const state = error ? 'error' : focused ? 'focused' : 'idle';
  return (
    <View className="mb-4">
      {label ? (
        <Text className="font-semibold text-ink text-sm mb-1.5 ml-1">{label}</Text>
      ) : null}
      <View
        className="flex-row items-center rounded-2xl px-4 py-1 border-[1.5px]"
        style={[fieldStateStyle[state], focused && !error ? { borderColor: brand.primary } : null, focused ? cardShadow : null]}
      >
        <Icon name={icon} size={20} color={focused ? brand.primary : '#94A3B8'} />
        <TextInput
          className="flex-1 py-3.5 px-3 text-base font-normal text-ink"
          placeholderTextColor="#94A3B8"
          secureTextEntry={!visible}
          autoCapitalize="none"
          {...props}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Icon name={visible ? 'eye' : 'eye-off'} size={20} color="#94A3B8" />
        </Pressable>
      </View>
      {error ? (
        <Text className="mt-1.5 ml-1 text-[13px] font-medium text-danger">{error}</Text>
      ) : null}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  className = '',
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      disabled={disabled || loading}
      className={`rounded-2xl bg-primary py-4 flex-row items-center justify-center active:bg-primary-dark ${
        disabled || loading ? 'opacity-60' : ''
      } ${className}`}
      style={({ pressed }) => [
        disabled || loading ? null : buttonShadow,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Text className="text-white text-base font-semibold">{title}</Text>
          <Icon name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
        </>
      )}
    </Pressable>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`rounded-[20px] bg-white border border-line p-4 ${className}`}
      style={cardShadow}
    >
      {children}
    </View>
  );
}

/** Section headings can wrap without pushing their action outside the screen. */
export function SectionLabel({
  title,
  action,
  onAction,
  className = '',
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  const brand = useBranding();
  return (
    <View className={`flex-row flex-wrap items-center justify-between gap-x-3 mb-3 ${className}`}>
      <Text className="flex-1 font-semibold text-ink text-[18px]" style={{ minWidth: 140 }}>
        {title}
      </Text>
      {action && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={`${action}: ${title}`}
          hitSlop={4}
          className="min-h-[44px] flex-row items-center"
        >
          <Text className="text-primary font-semibold text-sm mr-1">{action}</Text>
          <Icon name="arrow-right" size={15} color={brand.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Rounded square icon holder with a tinted background. */
export function IconTile({
  icon,
  tint = 'primary',
  size = 'md',
}: {
  icon: IconName;
  tint?: ColorTone | 'primary' | 'accent' | 'success' | 'navy';
  size?: 'sm' | 'md';
}) {
  const brand = useBranding();
  const tints = {
    ...colorTones,
    ...packageTones,
    primary: { surface: brand.primaryLight, ink: brand.primary },
    accent: { surface: brand.accentLight, ink: brand.accent },
    navy: { surface: '#0B1633', ink: '#FFFFFF' },
  } as const;
  const t = tints[tint];
  const box = size === 'sm' ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-2xl';
  return (
    <View className={`${box} items-center justify-center`} style={{ backgroundColor: t.surface }}>
      <Icon name={icon} size={size === 'sm' ? 18 : 21} color={t.ink} />
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View className="flex-row justify-between items-center py-2.5">
      <Text className="font-normal text-muted text-base">{label}</Text>
      <Text
        className="font-medium text-ink text-base text-right flex-shrink ml-4"
        style={tabularNums}
      >
        {value}
      </Text>
    </View>
  );
}

interface SelectOption {
  label: string;
  value: string;
}

export function SelectField({
  icon = 'map',
  placeholder,
  label,
  value,
  options,
  onChange,
  error,
  compact,
}: {
  icon?: IconName;
  placeholder: string;
  label?: string;
  value?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
  compact?: boolean;
}) {
  const brand = useBranding();
  const brandStyle = useBrandingStyle();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View className={compact ? 'flex-1 mb-4' : 'mb-4'}>
      {label ? (
        <Text className="font-semibold text-ink text-sm mb-1.5 ml-1">{label}</Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center rounded-2xl px-4 py-4 border-[1.5px] active:border-primary active:bg-white"
        style={error ? fieldStateStyle.error : fieldStateStyle.idle}
      >
        <Icon name={icon} size={20} color="#94A3B8" />
        <Text
          className={selected ? 'flex-1 px-3 text-base font-normal text-ink' : 'flex-1 px-3 text-base font-normal text-faint'}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevron-down" size={20} color="#94A3B8" />
      </Pressable>
      {error ? (
        <Text className="mt-1.5 ml-1 text-[13px] font-medium text-danger">{error}</Text>
      ) : null}
      <Modal visible={open} animationType="slide" transparent>
        <Pressable style={brandStyle} className="flex-1 bg-navy/60" onPress={() => setOpen(false)}>
          <View className="mt-auto rounded-t-[28px] bg-white p-5 max-h-[70%]">
            <View className="self-center w-10 h-1 rounded-full bg-line mb-4" />
            <Text className="text-lg font-semibold text-ink mb-3">{placeholder}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={`py-3.5 px-3 -mx-1 rounded-xl flex-row justify-between items-center active:bg-surface ${
                    item.value === value ? 'bg-primary-light' : ''
                  }`}
                >
                  <Text
                    className={`text-base ${
                      item.value === value
                        ? 'font-semibold text-primary'
                        : 'font-normal text-ink'
                    }`}
                  >
                    {item.label}
                  </Text>
                  {item.value === value ? (
                    <Icon name="check" size={18} color={brand.primary} />
                  ) : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Tones for StatusChip; each pairs a tinted pill with a solid dot. */
const chipTones = {
  ...packageTones,
  danger: { surface: '#FEF2F2', ink: '#DC2626' },
  neutral: { surface: '#F1F5F9', ink: '#475569' },
} as const;

/** Small status pill with a leading dot indicator. */
export function StatusChip({
  label,
  tone = 'primary',
  className = '',
}: {
  label: string;
  tone?: keyof typeof chipTones;
  className?: string;
}) {
  const t = chipTones[tone];
  return (
    <View
      className={`self-start flex-row items-center rounded-full px-3 py-1.5 ${className}`}
      style={{ backgroundColor: t.surface }}
    >
      <View
        className="w-1.5 h-1.5 rounded-full mr-2"
        style={{ backgroundColor: t.ink }}
      />
      <Text className="font-semibold text-[13px]" style={{ color: t.ink }}>{label}</Text>
    </View>
  );
}

/** Soft pulsing placeholder block used while content loads. */
export function Skeleton({
  className = '',
  style,
}: {
  className?: string;
  style?: ViewStyle;
}) {
  const pulse = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View style={{ opacity: pulse }}>
      <View className={`rounded-2xl bg-line/70 ${className}`} style={style} />
    </Animated.View>
  );
}

/** Skeleton stand-in for a list of cards — replaces the old bare spinner. */
export function LoadingView() {
  return (
    <View className="py-2">
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          className="rounded-3xl bg-white border border-line/60 p-4 mb-4"
          style={cardShadow}
        >
          <View className="flex-row items-center mb-4">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <View className="flex-1 ml-3">
              <Skeleton className="h-3.5 w-2/5 rounded-full mb-2" />
              <Skeleton className="h-3 w-3/5 rounded-full" />
            </View>
          </View>
          <Skeleton className="h-16 rounded-2xl" />
        </View>
      ))}
    </View>
  );
}

export function EmptyView({ message, icon = 'package', tone = 'blue' }: { message: string; icon?: IconName; tone?: ColorTone }) {
  const color = colorTones[tone];
  return (
    <View className="items-center justify-center py-14">
      <View className="w-20 h-20 rounded-[28px] items-center justify-center mb-4 rotate-6" style={{ backgroundColor: color.surface }}>
        <Icon name={icon} size={30} color={color.ink} />
      </View>
      <Text className="font-semibold text-ink text-base">{message}</Text>
      <Text className="font-normal text-faint text-sm leading-5 mt-1">
        Pull down to refresh anytime
      </Text>
    </View>
  );
}

/** Compact labeled pill for "create new" actions in list headers. */
export function AddPill({
  onPress,
  label = 'New',
}: {
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center rounded-xl bg-primary pl-3.5 pr-4 py-2.5 active:bg-primary-dark"
      style={({ pressed }) => [
        buttonShadow,
        { transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}
    >
      <Icon name="plus" size={16} color="#fff" />
      <Text className="text-white font-semibold text-sm ml-1">{label}</Text>
    </Pressable>
  );
}

export function MenuButton() {
  const openMenu = useUi((s) => s.openMenu);
  return (
    <Pressable
      onPress={openMenu}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      className="w-11 h-11 rounded-2xl bg-white border border-line items-center justify-center active:bg-surface"
      style={cardShadow}
    >
      <Icon name="menu" size={20} color="#0F172A" />
    </Pressable>
  );
}

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row flex-wrap items-center gap-3 py-4">
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-11 h-11 rounded-2xl bg-white border border-line items-center justify-center active:bg-surface"
        >
          <Icon name="arrow-left" size={20} color="#0F172A" />
        </Pressable>
      ) : null}
      <Text
        accessibilityRole="header"
        className={`flex-1 font-semibold text-ink ${onBack ? 'text-xl' : 'text-[28px]'}`}
        style={{ minWidth: 140 }}
      >
        {title}
      </Text>
      {right}
    </View>
  );
}
