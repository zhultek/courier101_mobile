import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../store/auth';
import { navigationRef } from '../navigation/ref';
import { getNotifications, isCurrentCustomer, pushSupported, syncOfficePush } from './officePush';
import { createAppFailure, recordAppFailure } from '../utils/appErrors';

export default function OfficePushManager() {
  const token = useAuth((s) => s.token);
  const userId = useAuth((s) => s.user?.id);
  const queryClient = useQueryClient();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!pushSupported || !token) return;
    let active = true;
    let syncing = false;
    const cleanups: (() => void)[] = [];
    let notificationModule: typeof Notifications;
    const sync = async (ask = false) => {
      if (syncing) return;
      syncing = true;
      try {
        await syncOfficePush(ask);
      } catch (error) {
        // Retry on foreground/network recovery; registration must not block sign-in.
        if (__DEV__) console.warn('Office push registration failed', error);
      } finally {
        syncing = false;
      }
    };
    const refresh = () => {
      for (const key of ['dashboard', 'track', 'item', 'invoice']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    };
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!active || !response || !isCurrentCustomer(response.notification.request.content.data)) return;
      const id = response.notification.request.identifier;
      if (handled.current === id) return;
      if (!navigationRef.isReady()) return;
      handled.current = id;
      refresh();
      navigationRef.navigate('Tabs', { screen: 'Track', params: { tab: 'readyForPickup' } });
      void notificationModule.clearLastNotificationResponseAsync().catch(() => {});
    };
    try {
      notificationModule = getNotifications();
      void sync(true);
      void notificationModule.getLastNotificationResponseAsync().then(open).catch(() => {});
      // Navigation may become ready after a cold-start response is read.
      const ready = navigationRef.addListener('ready', () => {
        void notificationModule.getLastNotificationResponseAsync().then(open).catch(() => {});
      });
      cleanups.push(ready);
      const received = notificationModule.addNotificationReceivedListener((notification) => {
        if (isCurrentCustomer(notification.request.content.data)) refresh();
      });
      cleanups.push(() => received.remove());
      const response = notificationModule.addNotificationResponseReceivedListener(open);
      cleanups.push(() => response.remove());
      const tokenChange = notificationModule.addPushTokenListener(() => { void sync(); });
      cleanups.push(() => tokenChange.remove());
      const foreground = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          void sync();
          refresh();
        }
      });
      cleanups.push(() => foreground.remove());
    } catch (error) {
      // Missing native modules or Firebase configuration disable alerts, not the app.
      recordAppFailure(createAppFailure(error, 'STARTUP', 'Office notifications'));
      active = false;
    }
    return () => {
      active = false;
      for (const cleanup of cleanups) {
        try { cleanup(); } catch { /* Continue cleaning up other listeners. */ }
      }
    };
  }, [token, userId, queryClient]);

  return null;
}
