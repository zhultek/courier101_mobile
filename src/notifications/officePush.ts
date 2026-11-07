import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type * as NotificationModule from 'expo-notifications';
import { api } from '../api/client';
import { useAuth } from '../store/auth';

export const pushSupported = Platform.OS !== 'web' && Constants.executionEnvironment !== 'storeClient';
let registeredToken: string | null = null;
let pendingSync: Promise<unknown> = Promise.resolve();

export function isCurrentCustomer(data?: Record<string, unknown>): boolean {
  const { token, user, courier } = useAuth.getState();
  return !!token && !!user?.id && data?.type === 'office_arrival'
    && Number(data.userId) === user.id && Number(data.courierId) === courier?.courier_id;
}

let notifications: typeof NotificationModule | null = null;

/** Optional native notifications must never fail during the app's imports. */
export function getNotifications(): typeof NotificationModule {
  if (notifications) return notifications;
  if (!pushSupported) throw new Error('Push notifications are unavailable in this environment.');
  const Notifications: typeof NotificationModule = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const show = isCurrentCustomer(notification.request.content.data);
      return { shouldShowBanner: show, shouldShowList: show, shouldPlaySound: show, shouldSetBadge: false };
    },
  });
  notifications = Notifications;
  return Notifications;
}

export async function syncOfficePush(requestPermission = false): Promise<boolean> {
  if (!pushSupported) return false;
  const sessionToken = useAuth.getState().token;
  if (!sessionToken) return false;
  const Notifications = getNotifications();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('office-arrivals', {
      name: 'Office arrivals',
      description: 'Alerts when your packages arrive at the office for pickup',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (requestPermission && permission.canAskAgain && !permission.granted) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permission.granted) {
    await unregisterOfficePush(sessionToken);
    return false;
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('Push notification project is not configured');
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  // Serialize registration and logout so a slow registration cannot re-enable a signed-out device.
  pendingSync = pendingSync.catch(() => {}).then(async () => {
    if (useAuth.getState().token !== sessionToken) return;
    const registration = await api<{ user_id: number }>('/push-devices', {
      method: 'POST', sessionToken, body: { token, platform: Platform.OS },
    });
    registeredToken = token;
    const state = useAuth.getState();
    // Existing installations may have a cached profile from before the API exposed IDs.
    if (state.token === sessionToken && state.user && state.user.id !== registration.user_id) {
      state.setUser({ ...state.user, id: registration.user_id });
    }
  });
  await pendingSync;
  return useAuth.getState().token === sessionToken;
}

export async function unregisterOfficePush(sessionToken = useAuth.getState().token): Promise<void> {
  pendingSync = pendingSync.catch(() => {}).then(async () => {
    if (!registeredToken || !sessionToken) return;
    await api('/push-devices', { method: 'DELETE', sessionToken, body: { token: registeredToken } });
    registeredToken = null;
  });
  await pendingSync;
}
