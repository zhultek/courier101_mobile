import React, { createContext, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { vars } from 'nativewind';
import { useAuth } from '../store/auth';
import { buildBranding, brandingVariables } from './branding';

const BrandingContext = createContext(buildBranding(null));
export const useBranding = () => useContext(BrandingContext);
// Modals render into a separate native/web surface, so they need their own variable scope.
export function useBrandingStyle() {
  const brand = useBranding();
  return useMemo(() => vars(brandingVariables(brand)), [brand]);
}
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const appearance = useAuth(s => s.courier?.appearance);
  const brand = useMemo(() => buildBranding(appearance), [appearance]);
  const variables = useMemo(() => vars(brandingVariables(brand)), [brand]);
  return (
    <BrandingContext.Provider value={brand}>
      <View style={[{ flex: 1 }, variables]}>{children}</View>
    </BrandingContext.Provider>
  );
}
