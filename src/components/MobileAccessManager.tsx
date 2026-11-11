import { useEffect } from 'react';
import { AppState } from 'react-native';
import type { CourierInfo } from '../api/types';
import { normalizeAppearance } from '../theme/branding';
import { api } from '../api/client';
import { queryClient } from '../api/queryClient';
import { useAuth } from '../store/auth';

// Independent of native push support: also protects Expo Go and web sessions.
export default function MobileAccessManager() {
  const token = useAuth((s) => s.token);
  const code = useAuth((s) => s.courier?.code);

  useEffect(() => {
    if (!token && !code) return;
    let active = true;
    let checking = false;
    let currentRequest: AbortController | null = null;
    let lastVersion: string | null = null;
    const check = async () => {
      if (!active || checking || AppState.currentState === 'background' || AppState.currentState === 'inactive') return;
      checking = true;
      const controller = new AbortController();
      currentRequest = controller;
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        if (token) {
          const result = await api<{ version: string; appearance?: unknown }>('/data-version', { sessionToken: token, signal: controller.signal });
          if (!active || controller.signal.aborted) return;
          if (typeof result.version === 'string' && result.version !== lastVersion) {
            lastVersion = result.version;
            const current = useAuth.getState().courier;
            if (current && result.appearance !== undefined) {
              useAuth.getState().setCourier({ ...current, appearance: normalizeAppearance(result.appearance) });
            }
            for (const key of ['dashboard', 'track', 'invoice', 'item', 'profile']) {
              void queryClient.invalidateQueries({ queryKey: [key] });
            }
          }
        } else if (code) {
          const result = await api<{ data: CourierInfo }>('/courier/code', { method: 'POST', auth: false, body: { code }, signal: controller.signal });
          if (active && !controller.signal.aborted && result.data?.code === code) {
            const current = useAuth.getState().courier;
            if (JSON.stringify(current) !== JSON.stringify(result.data)) useAuth.getState().setCourier(result.data);
          }
        }
      } catch {
        // The API client handles access rejection. Network failures do not log out customers.
      } finally {
        clearTimeout(timeout);
        currentRequest = null;
        checking = false;
      }
    };
    void check();
    const interval = setInterval(() => { void check(); }, 15_000);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => {
      active = false;
      clearInterval(interval);
      foreground.remove();
      currentRequest?.abort();
    };
  }, [token, code]);

  return null;
}
