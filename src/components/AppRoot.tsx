import React from 'react';
import AppErrorBoundary from './AppErrorBoundary';
import { resetViewCache, recoverSignIn } from '../utils/appRecovery';

function Application() {
  // Import failures (including missing native modules in an older binary)
  // happen inside the boundary rather than before registerRootComponent.
  const App = require('../../App').default;
  return <App />;
}

function restartApplication(): void {
  // If the app failed during its imports, some stores may be unavailable.
  try { resetViewCache(); } catch { /* Retrying still remounts the app. */ }
}

export default function AppRoot() {
  return (
    <AppErrorBoundary root screen="Application startup" homeLabel="Restart app" onHome={restartApplication} onRetry={restartApplication} onSignIn={recoverSignIn}>
      <Application />
    </AppErrorBoundary>
  );
}
