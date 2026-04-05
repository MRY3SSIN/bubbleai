import { Stack } from 'expo-router';
import 'react-native-reanimated';

import { AppProviders } from '@/src/lib/providers';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/new" />
        <Stack.Screen name="chat/[sessionId]" />
        <Stack.Screen name="voice/[sessionId]" />
        <Stack.Screen name="analytics/[metric]" />
        <Stack.Screen name="journal/[entryId]" />
        <Stack.Screen name="journal/new-entry" />
        <Stack.Screen name="checkin/new" />
        <Stack.Screen name="settings/index" />
      </Stack>
    </AppProviders>
  );
}

