import { Platform } from 'react-native';
import { createAppFailure, recordAppFailure, type AppFailure } from './appErrors';

const listeners = new Set<(failure: AppFailure) => void>();
let installed = false;

export function listenForRuntimeErrors(listener: (failure: AppFailure) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function report(error: unknown): boolean {
  if (!listeners.size) return false;
  let screen = 'Application';
  try { screen = require('../navigation/ref').navigationRef.getCurrentRoute()?.name ?? screen; } catch { /* Navigation may not have started. */ }
  const failure = createAppFailure(error, 'RUNTIME', screen);
  recordAppFailure(failure);
  for (const listener of listeners) listener(failure);
  return true;
}

/** Use the installed RN 0.86 exception listener; retain the older-runtime fallback. */
export function installRuntimeErrorHandling(): void {
  if (installed) return;
  installed = true;
  const runtime = globalThis as typeof globalThis & {
    RN$registerExceptionListener?: (listener: (event: {
      message: string; isFatal: boolean; isComponentError?: boolean;
      extraData?: { rawStack?: string }; preventDefault: () => void;
    }) => void) => void;
    ErrorUtils?: {
      getGlobalHandler: () => (error: unknown, fatal?: boolean) => void;
      setGlobalHandler: (handler: (error: unknown, fatal?: boolean) => void) => void;
    };
  };
  if (runtime.RN$registerExceptionListener) {
    runtime.RN$registerExceptionListener((event) => {
      // React render errors belong to the nearest boundary. Do not replace
      // the entire app for warnings or console.error calls.
      if (event.isComponentError || (!event.isFatal && !event.message.startsWith('Uncaught (in promise'))) return;
      if (report({ message: event.message, stack: event.extraData?.rawStack }) && !__DEV__) event.preventDefault();
    });
  } else if (runtime.ErrorUtils) {
    const previous = runtime.ErrorUtils.getGlobalHandler();
    runtime.ErrorUtils.setGlobalHandler((error, fatal) => {
      const handled = report(error);
      if (__DEV__ || !handled) previous(error, fatal);
    });
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('error', (event) => { if (report(event.error) && !__DEV__) event.preventDefault(); });
    window.addEventListener('unhandledrejection', (event) => { if (report(event.reason) && !__DEV__) event.preventDefault(); });
  }
}
