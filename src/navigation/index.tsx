import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../components/Icon';
import { useAuth, useDeliveryEnabled } from '../store/auth';
import { navigationRef } from './ref';
import { SideMenu } from '../components/SideMenu';
import type {
  AppStackParamList,
  AuthStackParamList,
  MainTabParamList,
} from './types';

import CourierCodeScreen from '../screens/auth/CourierCodeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

import DashboardScreen from '../screens/main/DashboardScreen';
import TrackScreen from '../screens/main/TrackScreen';
import PrealertsScreen from '../screens/main/PrealertsScreen';
import ShopForMeScreen from '../screens/main/ShopForMeScreen';
import DeliveriesScreen from '../screens/main/DeliveriesScreen';
import ItemDetailsScreen from '../screens/main/ItemDetailsScreen';
import InvoiceScreen from '../screens/main/InvoiceScreen';
import CreatePrealertScreen from '../screens/main/CreatePrealertScreen';
import CreateDeliveryScreen from '../screens/main/CreateDeliveryScreen';
import CreateShopForMeScreen from '../screens/main/CreateShopForMeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen';
import CalculatorScreen from '../screens/main/CalculatorScreen';
import RatesScreen from '../screens/main/RatesScreen';
import AuthorizedUsersScreen from '../screens/main/AuthorizedUsersScreen';
import CreateAuthorizedUserScreen from '../screens/main/CreateAuthorizedUserScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, IconName> = {
  Dashboard: 'home',
  Track: 'map-pin',
  Prealerts: 'bell',
  Shop: 'shopping-bag',
  Deliveries: 'truck',
};

// Plain inline styles only: dynamically swapping NativeWind classes on the
// focused tab was unreliable on device (tabs collapsed after navigation).
function PillTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom, 12),
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0B1633',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#24345F',
        boxShadow:
          '0px 2px 6px rgba(11, 22, 51, 0.2), 0px 16px 32px rgba(11, 22, 51, 0.35)',
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={{
              flex: focused ? 2.6 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              paddingVertical: 12,
              backgroundColor: focused ? '#2563EB' : 'transparent',
              boxShadow: focused
                ? '0px 4px 12px rgba(37, 99, 235, 0.45)'
                : undefined,
            }}
          >
            <Icon
              name={TAB_ICONS[route.name as keyof MainTabParamList]}
              size={20}
              color={focused ? '#FFFFFF' : '#8DA2CE'}
            />
            {focused ? (
              <Text
                numberOfLines={1}
                style={{
                  color: '#FFFFFF',
                  fontWeight: '600',
                  marginLeft: 6,
                  fontSize: 15,
                }}
              >
                {route.name}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function MainTabs() {
  const deliveryEnabled = useDeliveryEnabled();
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PillTabBar {...props} />}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      <Tabs.Screen name="Track" component={TrackScreen} />
      <Tabs.Screen name="Prealerts" component={PrealertsScreen} />
      <Tabs.Screen name="Shop" component={ShopForMeScreen} />
      {deliveryEnabled ? (
        <Tabs.Screen name="Deliveries" component={DeliveriesScreen} />
      ) : null}
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const courier = useAuth((s) => s.courier);
  const token = useAuth((s) => s.token);

  return (
    <NavigationContainer ref={navigationRef}>
      {token ? (
        <>
          <AppStack.Navigator screenOptions={{ headerShown: false }}>
            <AppStack.Screen name="Tabs" component={MainTabs} />
            <AppStack.Screen name="ItemDetails" component={ItemDetailsScreen} />
            <AppStack.Screen name="Invoice" component={InvoiceScreen} />
            <AppStack.Screen name="CreatePrealert" component={CreatePrealertScreen} />
            <AppStack.Screen name="CreateDelivery" component={CreateDeliveryScreen} />
            <AppStack.Screen name="CreateShopForMe" component={CreateShopForMeScreen} />
            <AppStack.Screen name="Profile" component={ProfileScreen} />
            <AppStack.Screen name="EditProfile" component={EditProfileScreen} />
            <AppStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <AppStack.Screen name="Calculator" component={CalculatorScreen} />
            <AppStack.Screen name="Rates" component={RatesScreen} />
            <AppStack.Screen name="AuthorizedUsers" component={AuthorizedUsersScreen} />
            <AppStack.Screen
              name="CreateAuthorizedUser"
              component={CreateAuthorizedUserScreen}
            />
          </AppStack.Navigator>
          <SideMenu />
        </>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          {!courier ? (
            <AuthStack.Screen name="CourierCode" component={CourierCodeScreen} />
          ) : (
            <>
              <AuthStack.Screen name="Login" component={LoginScreen} />
              <AuthStack.Screen name="Register" component={RegisterScreen} />
              <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </>
          )}
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
