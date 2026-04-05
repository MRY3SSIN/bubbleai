import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from '@/src/components/layout/Screen';
import { initializeMockState, useAppStore } from '@/src/lib/app-store';
import { authService } from '@/src/lib/auth';
import { env } from '@/src/lib/env';
import { colors } from '@/src/theme';

export default function IndexScreen() {
  const router = useRouter();
  const hydrated = useAppStore((state) => state.hydrated);
  const session = useAppStore((state) => state.session);
  const profile = useAppStore((state) => state.profile);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      if (env.isMock) {
        initializeMockState();
      } else {
        await authService.restoreSession();
      }

      if (active) {
        setBootstrapped(true);
      }
    };

    bootstrap().catch(() => {
      if (active) {
        setBootstrapped(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !bootstrapped) {
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
  }, [bootstrapped, hydrated, profile?.onboardingComplete, router, session, session?.onboardingComplete]);

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
