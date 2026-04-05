import { Stack } from 'expo-router';
import 'react-native-reanimated';

import { AppProviders } from '@/src/lib/providers';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </AppProviders>
  );
}
