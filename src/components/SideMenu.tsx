import { useBranding, useBrandingStyle } from '../theme/BrandingProvider';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from './Icon';
import { useUi } from '../store/ui';
import { useAuth } from '../store/auth';
import { useLogout } from '../api/hooks';
import { navigate } from '../navigation/ref';
import type { AppStackParamList } from '../navigation/types';
import { colorTones, featureTones, type ColorTone } from '../theme/colors';

const PANEL_WIDTH = Math.min(300, Dimensions.get('window').width * 0.8);
const APP_VERSION = require('../../package.json').version as string;

const MENU_ITEMS: {
  icon: IconName;
  label: string;
  screen: keyof AppStackParamList;
  tone: ColorTone;
}[] = [
  { icon: 'user-circle', label: 'Account', screen: 'Profile', tone: featureTones.account },
  { icon: 'id-card', label: 'Edit profile', screen: 'EditProfile', tone: featureTones.account },
  { icon: 'coins', label: 'Rates', screen: 'Rates', tone: featureTones.rates },
  { icon: 'calculator', label: 'Calculator', screen: 'Calculator', tone: featureTones.calculator },
  { icon: 'users-three', label: 'Authorized users', screen: 'AuthorizedUsers', tone: featureTones.authorizedUsers },
  { icon: 'key', label: 'Change password', screen: 'ChangePassword', tone: featureTones.account },
];

export function SideMenu() {
  const brand = useBranding();
  const brandStyle = useBrandingStyle();
  const insets = useSafeAreaInsets();
  const menuOpen = useUi((s) => s.menuOpen);
  const closeMenu = useUi((s) => s.closeMenu);
  const user = useAuth((s) => s.user);
  const courier = useAuth((s) => s.courier);
  const logoUrl = courier?.logo_url;
  const logout = useLogout();

  // Keep the Modal mounted while the close animation plays out.
  const [visible, setVisible] = useState(menuOpen);
  const slide = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (menuOpen) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: -PANEL_WIDTH,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }
  }, [menuOpen, slide, backdrop]);

  const go = (screen: keyof AppStackParamList) => {
    closeMenu();
    navigate(screen);
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={closeMenu}>
      <View style={[{ flex: 1, flexDirection: 'row' }, brandStyle]}>
        <Animated.View
          style={{
            width: PANEL_WIDTH,
            backgroundColor: '#fff',
            borderTopRightRadius: 28,
            borderBottomRightRadius: 28,
            overflow: 'hidden',
            transform: [{ translateX: slide }],
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          {/* Header: courier logo, close, user identity */}
          <View className="px-5 pb-4">
            <View className="flex-row items-start justify-between">
              {logoUrl ? (
                <Image
                  source={{ uri: logoUrl }}
                  style={{ height: 56, width: 160, backgroundColor: 'transparent' }}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require('../../assets/logo.png')}
                  style={{ height: 56, width: 160, backgroundColor: 'transparent' }}
                  resizeMode="contain"
                />
              )}
              <Pressable
                onPress={closeMenu}
                hitSlop={10}
                className="mt-1 w-9 h-9 rounded-xl bg-surface items-center justify-center"
              >
                <Icon name="x" size={20} color="#0F172A" />
              </Pressable>
            </View>

            <LinearGradient colors={[brand.headerStart, brand.headerEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ marginTop: 16, borderRadius: 24, padding: 16 }}>
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center">
                  <Text className="text-white font-bold text-base">
                    {(user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-white font-semibold text-base" numberOfLines={1}>
                    {user?.first_name} {user?.last_name}
                  </Text>
                  <Text className="font-normal text-white text-[13px]" numberOfLines={1}>
                    {user?.email}
                  </Text>
                </View>
              </View>
              <View className="mt-3 flex-row items-center rounded-2xl bg-white px-3.5 py-2.5">
                <Icon name="mailbox" size={18} color={brand.accent} />
                <Text className="ml-2 font-medium text-muted text-[13px]">Mailbox</Text>
                <Text className="flex-1 text-right font-bold text-ink text-[15px]">
                  {user?.mailbox}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Menu items */}
          <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 8 }}>
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.screen}
                onPress={() => go(item.screen)}
                className="flex-row items-center px-5 py-4 active:bg-surface"
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: item.tone === 'blue' ? brand.primaryLight : colorTones[item.tone].surface }}>
                  <Icon name={item.icon} size={18} color={item.tone === 'blue' ? brand.primary : colorTones[item.tone].ink} />
                </View>
                <Text className="ml-4 text-base text-ink font-medium">{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Footer: version + logout */}
          <View className="px-5 border-t border-line">
            <Text className="font-normal text-muted text-sm mt-3">Version {APP_VERSION}</Text>
            <Pressable
              onPress={() => {
                closeMenu();
                logout.mutate();
              }}
              className="flex-row items-center py-4"
            >
              <View className="w-10 h-10 rounded-xl bg-danger-light items-center justify-center">
                <Icon name="log-out" size={18} color="#DC2626" />
              </View>
              <Text className="ml-4 text-base text-danger font-semibold">Log out</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={{ flex: 1, opacity: backdrop }}>
          <Pressable
            onPress={closeMenu}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}
