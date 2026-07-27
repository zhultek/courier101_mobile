import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { CourierInfo, User } from '../api/types';

const TOKEN_KEY = 'courier101_token';

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
  setCourier: (courier: CourierInfo) => void;
  clearCourier: () => void;
  signIn: (token: string, user: User) => Promise<void>;
  setUser: (user: User) => void;
  signOut: () => Promise<void>;
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
      setCourier: (courier) => set({ courier }),
      clearCourier: () => set({ courier: null }),
      signIn: async (token, user) => {
        await tokenStorage.set(token);
        set({ token, user });
      },
      setUser: (user) => set({ user }),
      signOut: async () => {
        await tokenStorage.delete().catch(() => {});
        set({ token: null, user: null });
      },
      hydrateToken: async () => {
        try {
          const token = await tokenStorage.get();
          set({ token, hydrated: true });
        } catch {
          set({ token: null, hydrated: true });
        }
      },
    }),
    {
      name: 'courier101-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Token lives in SecureStore, not AsyncStorage.
      partialize: (state) => ({ courier: state.courier, user: state.user }),
    }
  )
);
