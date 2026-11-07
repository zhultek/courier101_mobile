import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform, Text } from 'react-native';
import { Card, PrimaryButton } from '../components/ui';
import { notify } from '../utils/dialogs';
import { getNotifications, pushSupported, syncOfficePush } from './officePush';

export default function OfficePushSettings() {
  const [enabled, setEnabled] = useState(false);
  const [canAsk, setCanAsk] = useState(true);
  const [busy, setBusy] = useState(false);
  const readPermission = useCallback(async () => {
    if (!pushSupported) return;
    const permission = await getNotifications().getPermissionsAsync();
    setEnabled(permission.granted);
    setCanAsk(permission.canAskAgain);
  }, []);
  useEffect(() => {
    if (!pushSupported) return;
    void readPermission().catch(() => {});
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void readPermission().catch(() => {});
    });
    return () => subscription.remove();
  }, [readPermission]);

  if (Platform.OS === 'web' || !pushSupported) return null;
  return (
    <Card className="mt-4 px-5">
      <Text className="text-base font-semibold text-ink mb-2">Office arrival alerts</Text>
      <Text className="text-base text-muted leading-6 mb-4">
        {enabled
          ? 'Notifications are allowed on this device. We’ll alert you when a package arrives at the office.'
          : 'Turn on notifications to know when your packages are ready for pickup.'}
      </Text>
      {pushSupported ? <PrimaryButton
        title={enabled ? 'Notification settings' : 'Enable notifications'}
        loading={busy}
        onPress={async () => {
          setBusy(true);
          try {
            if (enabled || !canAsk) await Linking.openSettings();
            else {
              await syncOfficePush(true);
              await readPermission();
            }
          } catch {
            notify('Could not enable alerts', 'Please check your connection and try again.');
          } finally { setBusy(false); }
        }}
      /> : null}
    </Card>
  );
}
