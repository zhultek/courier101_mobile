import { useEffect } from 'react';
import { Alert, AppState, Linking, Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import { AppRelease, getAvailableUpdate, openAppStore } from './appRelease';

const CHECK_INTERVAL = 5 * 60 * 1000;
const REMIND_AFTER = 24 * 60 * 60 * 1000;

export default function AppUpdateManager() {
  useEffect(() => {
    // Compare the installed binary, never the potentially newer OTA manifest.
    if (__DEV__ || Constants.expoGoConfig || !Application.nativeApplicationVersion ||
      (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;

    let active = true;
    let checking = false;
    let dialogOpen = false;
    let currentRequest: AbortController | null = null;
    const prompted = new Set<string>();

    const openStore = async (release: AppRelease) => {
      try {
        await openAppStore(release, (url) => Linking.openURL(url));
      } catch {
        if (!active) return;
        Alert.alert('Unable to open the store', 'Please try again to download the latest update.', [
          { text: 'Cancel', style: 'cancel', onPress: () => { dialogOpen = false; } },
          { text: 'Try again', onPress: () => { void openStore(release); } },
        ], { cancelable: false });
        return;
      }
      dialogOpen = false;
    };

    const check = async () => {
      if (!active || checking || dialogOpen || AppState.currentState !== 'active') return;
      checking = true;
      const controller = new AbortController();
      currentRequest = controller;
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        const result = await api<unknown>('/mobile-app-release', { auth: false, signal: controller.signal });
        const release = getAvailableUpdate(result, Platform.OS, Application.nativeApplicationVersion);
        if (!release || prompted.has(release.version)) return;
        const reminderKey = `courier101:update-reminder:${Platform.OS}:${release.version}`;
        const remindAt = await AsyncStorage.getItem(reminderKey).catch(() => null);
        if (!active || controller.signal.aborted || AppState.currentState !== 'active') return;
        if (remindAt && Number(remindAt) > Date.now()) return;
        prompted.add(release.version);
        dialogOpen = true;
        Alert.alert(
          'Update available',
          `A new version (${release.version}) is available. Update now to get the latest features and improvements.`,
          [
            {
              text: 'Later', style: 'cancel', onPress: () => {
                dialogOpen = false;
                void AsyncStorage.setItem(reminderKey, String(Date.now() + REMIND_AFTER)).catch(() => {});
              },
            },
            { text: 'Update now', onPress: () => { void openStore(release); } },
          ],
          { cancelable: false }
        );
      } catch {
        // Release-check failures never block customers or change their session.
      } finally {
        clearTimeout(timeout);
        currentRequest = null;
        checking = false;
      }
    };

    void check();
    const interval = setInterval(() => { void check(); }, CHECK_INTERVAL);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => {
      active = false;
      clearInterval(interval);
      foreground.remove();
      currentRequest?.abort();
    };
  }, []);

  return null;
}
