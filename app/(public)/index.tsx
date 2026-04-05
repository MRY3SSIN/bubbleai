import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BubbleLogo } from '@/src/components/brand/BubbleLogo';
import { BubblePattern } from '@/src/components/brand/BubblePattern';
import { PillButton } from '@/src/components/PillButton';
import { Screen } from '@/src/components/layout/Screen';
import { colors, spacing, typography } from '@/src/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen padded={false}>
      <BubblePattern />
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <BubbleLogo size={76} />
        </View>
        <Text style={styles.title}>
          Welcome to{'\n'}
          <Text style={styles.titleAccent}>BubbleAI</Text>
        </Text>
        <Text style={styles.subtitle}>
          Your mindful emotional wellness companion, built for calm support any time you need it.
        </Text>
        <PillButton label="Get Started" onPress={() => router.push('/(auth)/signup')} />
        <Text onPress={() => router.push('/(auth)/login')} style={styles.link}>
          Already have an account? <Text style={styles.linkAccent}>Sign In.</Text>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    marginTop: -30,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  logoWrap: {
    alignItems: 'center',
  },
  title: {
    color: colors.ink,
    marginTop: spacing.lg,
    textAlign: 'center',
    ...typography.h1,
    fontSize: 40,
    lineHeight: 46,
  },
  titleAccent: {
    color: colors.mint,
  },
  subtitle: {
    color: colors.inkMuted,
    marginBottom: spacing.xxxl,
    marginTop: spacing.md,
    textAlign: 'center',
    ...typography.body,
  },
  link: {
    color: colors.inkMuted,
    marginTop: spacing.xl,
    textAlign: 'center',
    ...typography.body,
  },
  linkAccent: {
    color: colors.mint,
  },
});

