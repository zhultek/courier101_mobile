import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomTabBarHeightCallbackContext, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from './Icon';
import type { MainTabParamList } from '../navigation/types';

const TABS: Record<keyof MainTabParamList, { icon: IconName; label: string }> = {
  Dashboard: { icon: 'home', label: 'Home' },
  Track: { icon: 'package', label: 'Track' },
  Prealerts: { icon: 'bell', label: 'Prealerts' },
  Shop: { icon: 'shopping-bag', label: 'Shop' },
  Deliveries: { icon: 'truck', label: 'Delivery' },
};

export function BottomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const onHeightChange = React.useContext(BottomTabBarHeightCallbackContext);
  const [pressedKey, setPressedKey] = React.useState<string | null>(null);
  return (
    <View
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height + Math.max(insets.bottom, 12))}
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom, 12),
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: '#0B1633',
        borderRadius: 24,
        padding: 6,
        boxShadow: '0px 4px 16px rgba(11, 22, 51, 0.16)',
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = TABS[route.name as keyof MainTabParamList];
        const options = descriptors[route.key].options;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={options.tabBarAccessibilityLabel ?? tab.label}
            accessibilityState={{ selected: focused }}
            testID={options.tabBarButtonTestID}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            onPressIn={() => setPressedKey(route.key)}
            onPressOut={() => setPressedKey(null)}
            // NativeWind drops Pressable style callbacks. Keep layout in a
            // plain object so every tab retains its width and selected state.
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 56,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
              paddingVertical: 8,
              paddingHorizontal: 2,
              backgroundColor: focused ? '#2563EB' : 'transparent',
              opacity: pressedKey === route.key ? 0.75 : 1,
            }}
          >
            <Icon name={tab.icon} size={21} color={focused ? '#FFFFFF' : '#B8C7E4'} />
            <Text
              style={{
                color: focused ? '#FFFFFF' : '#B8C7E4',
                fontWeight: focused ? '600' : '500',
                marginTop: 4,
                fontSize: 11,
                textAlign: 'center',
                alignSelf: 'stretch',
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
