import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBar } from '../components/BottomTabBar';
import { useAuth, useDeliveryEnabled } from '../store/auth';
import { navigationRef } from './ref';
import { SideMenu } from '../components/SideMenu';
import AppErrorBoundary from '../components/AppErrorBoundary';
import { recoverSignIn, resetViewCache, returnToDashboard } from '../utils/appRecovery';
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
import FygaroPaymentScreen from '../screens/main/FygaroPaymentScreen';
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

function screenLayout({ children, route }: { children: React.ReactNode; route: { key: string; name: string } }) {
  return (
    <AppErrorBoundary key={route.key} screen={route.name} homeLabel={useAuth.getState().token ? 'Back to dashboard' : 'Back to sign in'} onHome={returnToDashboard} onRetry={resetViewCache} onSignIn={recoverSignIn}>
      {children}
    </AppErrorBoundary>
  );
}

function MainTabs() {
  const deliveryEnabled = useDeliveryEnabled();
  return (
    <Tabs.Navigator
      screenLayout={screenLayout}
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
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
          <AppStack.Navigator screenLayout={screenLayout} screenOptions={{ headerShown: false }}>
            <AppStack.Screen name="Tabs" component={MainTabs} />
            <AppStack.Screen name="ItemDetails" component={ItemDetailsScreen} />
            <AppStack.Screen name="Invoice" component={InvoiceScreen} />
            <AppStack.Screen name="FygaroPayment" component={FygaroPaymentScreen} />
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
        <AuthStack.Navigator screenLayout={screenLayout} screenOptions={{ headerShown: false }}>
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
