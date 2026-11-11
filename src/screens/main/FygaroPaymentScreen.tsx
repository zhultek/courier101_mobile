import { useBranding } from '../../theme/BrandingProvider';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Text } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';
import { Card, GradientScreen, PrimaryButton, ScreenHeader, money, tabularNums } from '../../components/ui';
import type { AppScreenProps } from '../../navigation/types';
import { notify } from '../../utils/dialogs';
import { api } from '../../api/client';
import type { TrackData } from '../../api/types';

export default function FygaroPaymentScreen({ navigation, route }: AppScreenProps<'FygaroPayment'>) {
  const brand = useBranding();
  const [payment, setPayment] = useState(route.params.payment);
  const [available, setAvailable] = useState(true);
  const queryClient = useQueryClient();
  const [opening, setOpening] = useState(false);
  const browserOpen = useRef(false);

  const refreshBalances = useCallback(() => {
    for (const key of ['dashboard', 'track', 'invoice', 'item']) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  }, [queryClient]);

  useEffect(() => {
    // Android resolves openBrowserAsync as soon as the custom tab opens.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && browserOpen.current) {
        browserOpen.current = false;
        setOpening(false);
        refreshBalances();
      }
    });
    return () => subscription.remove();
  }, [refreshBalances]);

  async function payNow() {
    if (browserOpen.current || opening) return;
    setOpening(true);
    try {
      const latest = await api<TrackData>('/track');
      queryClient.setQueryData(['track'], latest);
      if (!latest.fygaroPayment) {
        setAvailable(false);
        notify('Online payment unavailable', 'Your courier is not currently offering this payment option, or there are no packages ready for pickup.');
        return;
      }
      setPayment(latest.fygaroPayment);
      if (latest.fygaroPayment.total !== payment.total) {
        notify('Total updated', 'Your ready-for-pickup total has changed. Review the updated total before paying.');
        return;
      }
      const url = new URL(latest.fygaroPayment.url);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid payment link');
      browserOpen.current = true;
      const result = await WebBrowser.openBrowserAsync(latest.fygaroPayment.url, {
        createTask: false,
        dismissButtonStyle: 'close',
        toolbarColor: '#FFFFFF',
        controlsColor: brand.primary,
      });
      // Closing checkout is not proof of payment; reload the server's balances.
      if (result.type !== WebBrowser.WebBrowserResultType.OPENED) {
        browserOpen.current = false;
        refreshBalances();
      }
    } catch {
      browserOpen.current = false;
      notify('Unable to open Fygaro', 'Please try again or contact your courier for help with their payment link.');
    } finally {
      setOpening(false);
    }
  }

  return (
    <GradientScreen>
      <ScreenHeader title="Make payment online" onBack={() => navigation.goBack()} />
      <Card className="mt-4">
        <Text className="text-base font-semibold text-ink mb-2">Ready-for-pickup total</Text>
        <Text className="text-[36px] font-bold text-ink mb-4" style={tabularNums}>
          {money(payment.total)}
        </Text>
        <Text className="text-base font-normal text-muted leading-6 mb-6">
          Enter this exact total on Fygaro to complete your payment. Tap Pay Now to open your courier's payment page inside the app.
        </Text>
        {available ? <PrimaryButton title="Pay Now" onPress={payNow} loading={opening} /> : (
          <Text className="text-base text-muted">Online payment is currently unavailable.</Text>
        )}
      </Card>
    </GradientScreen>
  );
}
