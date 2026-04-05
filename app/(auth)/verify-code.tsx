import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useVerifyCode } from '@/src/features/auth/use-auth';
import { colors, radii, spacing, typography } from '@/src/theme';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { email = 'simar@bubbleai.app', context = 'signup' } = useLocalSearchParams<{
    email: string;
    context: 'signup' | 'forgot';
  }>();
  const mutation = useVerifyCode();
  const [digits, setDigits] = useState(['1', '2', '3', '4', '', '']);

  const submit = async () => {
    try {
      await mutation.mutateAsync({ email, code: digits.join('') });
      if (context === 'forgot') {
        router.replace('/(auth)/reset-password');
      } else {
        router.replace('/(onboarding)');
      }
    } catch (error) {
      Alert.alert('Code invalid', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <Screen>
      <BackHeader trailing={<Text onPress={() => router.push('/(auth)/signup')} style={styles.trailing}>Sign up</Text>} />
      <Text style={styles.title}>6 Digit Code</Text>
      <Text style={styles.subtitle}>Enter the security code we sent to {email}.</Text>
      <View style={styles.codeRow}>
        {digits.map((digit, index) => (
          <Pressable
            key={`digit-${index}`}
            onPress={() => {
              const next = [...digits];
              next[index] = digit ? '' : `${(index + 1) % 10}`;
              setDigits(next);
            }}
            style={[styles.codeBox, digit && styles.codeBoxFilled]}
          >
            <Text style={styles.codeText}>{digit}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.resend}>Didn’t get the code? <Text style={styles.resendAccent}>Resend Code</Text></Text>
      <PillButton label="Submit Code" loading={mutation.isPending} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  trailing: {
    color: colors.mint,
    ...typography.label,
  },
  title: {
    color: colors.ink,
    ...typography.h1,
  },
  subtitle: {
    color: colors.inkMuted,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
    ...typography.body,
  },
  codeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  codeBox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 48,
  },
  codeBoxFilled: {
    backgroundColor: colors.cardStrong,
  },
  codeText: {
    color: colors.ink,
    ...typography.h3,
  },
  resend: {
    color: colors.inkMuted,
    marginBottom: spacing.xxxl,
    ...typography.body,
  },
  resendAccent: {
    color: colors.mint,
  },
});

