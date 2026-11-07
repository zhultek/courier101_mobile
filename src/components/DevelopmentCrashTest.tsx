import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export default function DevelopmentCrashTest() {
  const [crash, setCrash] = useState(false);
  if (!__DEV__) return null;
  // Throw during render so the screen boundary, rather than the event-handler
  // runtime hook, is exercised. Retry remounts this component with fresh state.
  if (crash) throw new Error('Intentional development crash test. No customer data was changed.');

  return (
    <View className="mt-6 rounded-2xl border border-line bg-white p-5">
      <Text className="font-semibold text-ink text-base">Developer tools</Text>
      <Text className="mt-2 text-muted text-sm leading-5">
        Preview the recovery screen. This test is available only while developing the app.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Test error screen"
        onPress={() => setCrash(true)}
        className="mt-4 min-h-[48px] items-center justify-center rounded-xl bg-primary-light px-4 py-3 active:opacity-60"
      >
        <Text className="font-semibold text-primary text-base">Test error screen</Text>
      </Pressable>
    </View>
  );
}
