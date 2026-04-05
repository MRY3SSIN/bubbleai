import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PillButton } from '@/src/components/PillButton';
import { Screen } from '@/src/components/layout/Screen';
import { colors, spacing, typography } from '@/src/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <Text style={styles.title}>This page drifted away</Text>
        <Text style={styles.description}>Let’s bring you back to a calmer place in the app.</Text>
        <PillButton label="Go home" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  title: {
    color: colors.ink,
    textAlign: 'center',
    ...typography.h1,
  },
  description: {
    color: colors.inkMuted,
    textAlign: 'center',
    ...typography.body,
  },
});

