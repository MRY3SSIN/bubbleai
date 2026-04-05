import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BubbleLogo } from '@/src/components/brand/BubbleLogo';
import { PillButton } from '@/src/components/PillButton';
import { Screen } from '@/src/components/layout/Screen';
import { colors, spacing, typography } from '@/src/theme';

export default function OnboardingIntroScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.illustration}>
        <BubbleLogo size={128} />
      </View>
      <Text style={styles.title}>Let’s get to know you</Text>
      <Text style={styles.subtitle}>
        We use a little context to make BubbleAI feel gentle, relevant, and safe for you.
      </Text>
      <PillButton label="Get Started" onPress={() => router.push('/(onboarding)/profile')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  illustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxxl,
    marginTop: spacing.xxxl,
  },
  title: {
    color: colors.ink,
    textAlign: 'center',
    ...typography.h1,
  },
  subtitle: {
    color: colors.inkMuted,
    marginBottom: spacing.xxxl,
    marginTop: spacing.md,
    textAlign: 'center',
    ...typography.body,
  },
});
