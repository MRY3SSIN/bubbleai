import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from '@/src/components/layout/Screen';
import { initializeMockState, useAppStore } from '@/src/lib/app-store';
import { colors } from '@/src/theme';

export default function IndexScreen() {
  const router = useRouter();
  const hydrated = useAppStore((state) => state.hydrated);
  const session = useAppStore((state) => state.session);
  const profile = useAppStore((state) => state.profile);

  useEffect(() => {
    initializeMockState();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!session) {
      router.replace('/(public)');
      return;
    }

    if (!profile?.onboardingComplete || !session.onboardingComplete) {
      router.replace('/(onboarding)');
      return;
    }

    router.replace('/(tabs)');
  }, [hydrated, profile?.onboardingComplete, router, session, session?.onboardingComplete]);

  return (
    <Screen scroll={false}>
      <View style={styles.loader}>
        <ActivityIndicator color={colors.mint} size="large" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

