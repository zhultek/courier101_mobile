import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
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

const PANEL_WIDTH = Math.min(300, Dimensions.get('window').width * 0.8);
const APP_VERSION = require('../../package.json').version as string;

const MENU_ITEMS: {
  icon: IconName;
  label: string;
  screen: keyof AppStackParamList;
}[] = [
  { icon: 'user-circle', label: 'Account', screen: 'Profile' },
  { icon: 'id-card', label: 'Edit profile', screen: 'EditProfile' },
  { icon: 'coins', label: 'Rates', screen: 'Rates' },
  { icon: 'calculator', label: 'Calculator', screen: 'Calculator' },
  { icon: 'users-three', label: 'Authorized users', screen: 'AuthorizedUsers' },
  { icon: 'key', label: 'Change password', screen: 'ChangePassword' },
];

export function SideMenu() {
  const insets = useSafeAreaInsets();
  const menuOpen = useUi((s) => s.menuOpen);
  const closeMenu = useUi((s) => s.closeMenu);
  const user = useAuth((s) => s.user);
  const courier = useAuth((s) => s.courier);
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
      <View style={{ flex: 1, flexDirection: 'row' }}>
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
              {courier?.logo_url ? (
                <Image
                  source={{ uri: courier.logo_url }}
                  className="h-14 w-40"
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require('../../assets/logo.png')}
                  className="h-14 w-40"
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

            <View className="mt-4 rounded-3xl bg-surface p-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center">
                  <Text className="text-white font-bold text-base">
                    {(user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-ink font-semibold text-base" numberOfLines={1}>
                    {user?.first_name} {user?.last_name}
                  </Text>
                  <Text className="font-normal text-muted text-[13px]" numberOfLines={1}>
                    {user?.email}
                  </Text>
                </View>
              </View>
              <View className="mt-3 flex-row items-center rounded-2xl bg-white px-3.5 py-2.5">
                <Icon name="mailbox" size={18} color="#F97316" />
                <Text className="ml-2 font-medium text-muted text-[13px]">Mailbox</Text>
                <Text className="flex-1 text-right font-bold text-ink text-[15px]">
                  {user?.mailbox}
                </Text>
              </View>
            </View>
          </View>

          {/* Menu items */}
          <View className="flex-1 py-2">
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.screen}
                onPress={() => go(item.screen)}
                className="flex-row items-center px-5 py-4 active:bg-surface"
              >
                <View className="w-10 h-10 rounded-xl bg-primary-light items-center justify-center">
                  <Icon name={item.icon} size={18} color="#2563EB" />
                </View>
                <Text className="ml-4 text-base text-ink font-medium">{item.label}</Text>
              </Pressable>
            ))}
          </View>

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
