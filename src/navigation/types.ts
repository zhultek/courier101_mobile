import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { FygaroPayment } from '../api/types';

export type AuthStackParamList = {
  CourierCode: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type TrackTabKey = 'readyForPickup' | 'inTransit' | 'totalShipped';

export type MainTabParamList = {
  Dashboard: undefined;
  Track: { tab?: TrackTabKey } | undefined;
  Prealerts: undefined;
  Shop: undefined;
  Deliveries: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ItemDetails: { id: number };
  Invoice: { id: number };
  FygaroPayment: { payment: FygaroPayment };
  CreatePrealert: { trackingNumber?: string } | undefined;
  CreateDelivery: undefined;
  CreateShopForMe: undefined;
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Calculator: undefined;
  Rates: undefined;
  AuthorizedUsers: undefined;
  CreateAuthorizedUser: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;
export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;
