import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { CourierInfo, User } from '../api/types';
import { createAppFailure, recordAppFailure } from '../utils/appErrors';

const TOKEN_KEY = 'courier101_token';
let sessionRevision = 0;
let hydrationRevision = 0;
let restorationError: unknown;
let restoring: Promise<void> | null = null;

async function readWithDeadline<T>(read: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([read, new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Saved session storage did not respond.')), 10_000);
    })]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function savedCourier(value: unknown): CourierInfo | null {
  if (!record(value) || typeof value.code !== 'string' || !value.code.trim()
    || !Number.isInteger(value.courier_id) || Number(value.courier_id) <= 0) return null;
  return {
    code: value.code, courier_id: value.courier_id as number,
    logo_url: typeof value.logo_url === 'string' ? value.logo_url : null,
    delivery_enabled: typeof value.delivery_enabled === 'boolean' ? value.delivery_enabled : undefined,
  };
}

function savedUser(value: unknown): User | null {
  if (!record(value) || typeof value.first_name !== 'string') return null;
  const settings = record(value.settings) ? value.settings : {};
  const text = (key: string) => typeof value[key] === 'string' ? value[key] as string : '';
  return {
    id: typeof value.id === 'number' ? value.id : undefined,
    first_name: value.first_name, last_name: text('last_name'), email: text('email'),
    street_address: text('street_address'), city: text('city'), parish: text('parish'), mobile_cell: text('mobile_cell'),
    mailbox: text('mailbox'), trn: text('trn'), created_at: text('created_at'),
    pickup_location_id: typeof value.pickup_location_id === 'number' ? value.pickup_location_id : null,
    pickup_location: text('pickup_location'),
    delivery_enabled: typeof value.delivery_enabled === 'boolean' ? value.delivery_enabled : undefined,
    settings: {
      promotional_email: settings.promotional_email === true,
      email_notification: settings.email_notification === true,
      package_update: settings.package_update === true,
    },
  };
}

const persistedStorage = {
  getItem: (key: string) => readWithDeadline(AsyncStorage.getItem(key)),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value).catch(() => {}),
  removeItem: (key: string) => AsyncStorage.removeItem(key).catch(() => {}),
};

// SecureStore is unavailable on web; fall back to AsyncStorage there.
const tokenStorage = {
  get: () =>
    Platform.OS === 'web'
      ? AsyncStorage.getItem(TOKEN_KEY)
      : SecureStore.getItemAsync(TOKEN_KEY),
  set: (value: string) =>
    Platform.OS === 'web'
      ? AsyncStorage.setItem(TOKEN_KEY, value)
      : SecureStore.setItemAsync(TOKEN_KEY, value),
  delete: () =>
    Platform.OS === 'web'
      ? AsyncStorage.removeItem(TOKEN_KEY)
      : SecureStore.deleteItemAsync(TOKEN_KEY),
};

interface AuthState {
  courier: CourierInfo | null;
  user: User | null;
  token: string | null;
  hydrated: boolean;
  accessError: string | null;
  setCourier: (courier: CourierInfo) => void;
  clearCourier: () => void;
  signIn: (token: string, user: User) => Promise<void>;
  setUser: (user: User) => void;
  signOut: () => Promise<void>;
  resetCourier: (message?: string) => Promise<void>;
  hydrateToken: () => Promise<void>;
}

// Courier-level toggle. The user copy is refreshed at login and on profile
// fetches, so it wins over the courier-lookup copy; missing means enabled
// (older API responses don't send the flag).
export function useDeliveryEnabled(): boolean {
  return useAuth(
    (s) => s.user?.delivery_enabled ?? s.courier?.delivery_enabled ?? true
  );
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      courier: null,
      user: null,
      token: null,
      hydrated: false,
      accessError: null,
      setCourier: (courier) => { sessionRevision++; set({ courier, accessError: null }); },
      clearCourier: () => { sessionRevision++; set({ courier: null, accessError: null }); },
      signIn: async (token, user) => {
        const revision = ++sessionRevision;
        await readWithDeadline(tokenStorage.set(token));
        if (revision !== sessionRevision) return;
        set({ token, user, hydrated: true, accessError: null });
      },
      setUser: (user) => set({ user }),
      signOut: async () => {
        sessionRevision++;
        set({ token: null, user: null, hydrated: true });
        await readWithDeadline(tokenStorage.delete()).catch(() => {});
      },
      resetCourier: async (message = 'Invalid courier code. Please enter a valid courier code to continue.') => {
        sessionRevision++;
        // Hide courier data immediately, including while secure-storage deletion is pending.
        set({ token: null, user: null, courier: null, hydrated: true, accessError: message });
        await readWithDeadline(tokenStorage.delete()).catch(() => {});
      },
      hydrateToken: async (): Promise<void> => {
        if (restoring) return restoring;
        const revision = sessionRevision;
        restoring = (async () => {
          restorationError = undefined;
          // Restore metadata before accepting its SecureStore token, avoiding
          // a race between Zustand hydration and the navigator's first render.
          await useAuth.persist.rehydrate();
          if (restorationError) throw restorationError;
          const token = await readWithDeadline(tokenStorage.get());
          if (revision !== sessionRevision) return;
          if (token && (!get().courier || !get().user)) {
            throw new Error('Saved session information is incomplete.');
          }
          set({ token, hydrated: true });
        })().catch((error) => {
          if (revision !== sessionRevision) return;
          const failure = createAppFailure(error, 'STARTUP', 'Restore saved session');
          recordAppFailure(failure);
          set({ token: null, user: null, courier: null, hydrated: true,
            accessError: `We couldn’t restore your saved session. Please sign in again. Error code: ${failure.reference}` });
        }).finally(() => { restoring = null; });
        return restoring;
      },
    }),
    {
      name: 'courier101-auth',
      storage: createJSONStorage(() => persistedStorage),
      skipHydration: true,
      onRehydrateStorage: () => {
        hydrationRevision = sessionRevision;
        return (_state, error) => { restorationError = error; };
      },
      merge: (persisted, current) => {
        if (hydrationRevision !== sessionRevision || !record(persisted)) return current;
        const courier = savedCourier(persisted.courier);
        return { ...current, courier, user: courier ? savedUser(persisted.user) : null };
      },
      // Token lives in SecureStore, not AsyncStorage.
      partialize: (state) => ({ courier: state.courier, user: state.user }),
    }
  )
);
