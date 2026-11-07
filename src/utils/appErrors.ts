import { Platform } from 'react-native';

export interface AppFailure {
  reference: string;
  kind: 'SCREEN' | 'STARTUP' | 'RUNTIME';
  screen: string;
  message: string;
  stack: string;
  occurredAt: string;
  appVersion: string;
  platform: string;
}

function redact(value: string): string {
  return value
    .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [redacted]')
    .replace(/(["']?(?:password|token|authorization)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,}]+)/gi, '$1[redacted]')
    .replace(/(https?:\/\/[^\s?]+)\?[^\s)]+/gi, '$1?[redacted]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .slice(0, 6000);
}

export function createAppFailure(error: unknown, kind: AppFailure['kind'], screen: string): AppFailure {
  let message = 'Unexpected application error';
  let stack = '';
  try {
    if (error && typeof error === 'object' && 'message' in error) message = String(error.message);
    else if (typeof error === 'string') message = error;
    if (error && typeof error === 'object' && 'stack' in error && typeof error.stack === 'string') stack = error.stack;
  } catch { /* Even an unreadable error must have a usable recovery screen. */ }
  return {
    reference: `C101-${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase(),
    kind, screen, message: redact(message), stack: redact(stack),
    occurredAt: new Date().toISOString(),
    appVersion: require('../../app.json').expo.version,
    platform: `${Platform.OS} ${Platform.Version ?? ''}`.trim(),
  };
}

let saving: Promise<unknown> = Promise.resolve();

/** Local diagnostics only. Never include auth state, API bodies or customer records. */
export function recordAppFailure(failure: AppFailure): void {
  console.warn(`[${failure.reference}] ${failure.screen}: ${failure.message}`);
  saving = saving.catch(() => {}).then(async () => {
    const storage = require('@react-native-async-storage/async-storage').default;
    let previous: unknown = [];
    try { previous = JSON.parse(await storage.getItem('courier101-error-reports') ?? '[]'); } catch { /* Replace corrupt diagnostics. */ }
    const reports = Array.isArray(previous) ? previous.slice(-9) : [];
    await storage.setItem('courier101-error-reports', JSON.stringify([...reports, failure]));
  }).catch(() => {});
}

export function failureDetails(failure: AppFailure): string {
  return [failure.reference, `App ${failure.appVersion} | ${failure.platform}`, failure.occurredAt,
    `Screen: ${failure.screen}`, failure.message, failure.stack].filter(Boolean).join('\n');
}
