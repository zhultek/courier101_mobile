import './global.css';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandingProvider } from './src/theme/BrandingProvider';
import RootNavigator from './src/navigation';
import { useAuth } from './src/store/auth';
import OfficePushManager from './src/notifications/OfficePushManager';
import MobileAccessManager from './src/components/MobileAccessManager';
import { queryClient } from './src/api/queryClient';
import AppUpdateManager from './src/updates/AppUpdateManager';

export default function App() {
  const hydrated = useAuth((s) => s.hydrated);
  const hydrateToken = useAuth((s) => s.hydrateToken);
  const [startupError, setStartupError] = useState<Error | null>(null);

  useEffect(() => {
    void hydrateToken().catch((error) => setStartupError(error instanceof Error ? error : new Error('Unable to start the app.')));
  }, [hydrateToken]);

  if (startupError) throw startupError;

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
        }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <BrandingProvider>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <RootNavigator />
          <OfficePushManager />
          <MobileAccessManager />
          <AppUpdateManager />
        </QueryClientProvider>
      </SafeAreaProvider>
    </BrandingProvider>
  );
}
