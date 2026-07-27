import { createNavigationContainerRef } from '@react-navigation/native';
import type { AppStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<AppStackParamList>();

export function navigate(screen: keyof AppStackParamList) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(screen as any);
  }
}
