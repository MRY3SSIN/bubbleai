import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useResendCode, useVerifyCode } from '@/src/features/auth/use-auth';
import { colors, radii, spacing, typography } from '@/src/theme';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const hiddenInputRef = useRef<TextInput>(null);
  const { email = '', context = 'signup' } = useLocalSearchParams<{
    email: string;
    context: 'signup' | 'forgot';
  }>();
  const mutation = useVerifyCode();
  const resendMutation = useResendCode();
  const [code, setCode] = useState('');

  const digits = useMemo(
    () => Array.from({ length: 6 }, (_, index) => code[index] ?? ''),
    [code],
  );

  const submit = async () => {
    if (code.length !== 6) {
      Alert.alert('Enter your code', 'Please type the 6 digit code from your email.');
      return;
    }

    try {
      await mutation.mutateAsync({ email, code, context });
      if (context === 'forgot') {
        router.replace('/(auth)/reset-password');
      } else {
        router.replace('/(onboarding)');
      }
    } catch (error) {
      Alert.alert('Code invalid', error instanceof Error ? error.message : 'Try again.');
    }
  };

  const resendCode = async () => {
    try {
      await resendMutation.mutateAsync({ email, context });
      Alert.alert('Code sent', 'A fresh 6 digit code was sent to your email.');
    } catch (error) {
      Alert.alert('Unable to resend code', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <Screen>
      <BackHeader
        trailing={
          <Text onPress={() => router.push('/(auth)/signup')} style={styles.trailing}>
            Sign up
          </Text>
        }
      />
      <Text style={styles.title}>6 Digit Code</Text>
      <Text style={styles.subtitle}>Enter the security code we sent to {email}.</Text>

      <Pressable onPress={() => hiddenInputRef.current?.focus()} style={styles.codeRow}>
        {digits.map((digit, index) => {
          const active = index === Math.min(code.length, 5);
          return (
            <View
              key={`digit-${index}`}
              style={[
                styles.codeBox,
                digit && styles.codeBoxFilled,
                active && styles.codeBoxActive,
              ]}
            >
              <Text style={styles.codeText}>{digit || ' '}</Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={hiddenInputRef}
        autoFocus
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={(value) => setCode(value.replace(/[^0-9]/g, '').slice(0, 6))}
        returnKeyType="done"
        style={styles.hiddenInput}
        value={code}
      />

      <Text style={styles.resend}>
        Didn’t get the code?{' '}
        <Text onPress={resendCode} style={styles.resendAccent}>
          Resend Code
        </Text>
      </Text>

      <PillButton
        disabled={code.length !== 6}
        label="Submit Code"
        loading={mutation.isPending}
        onPress={submit}
      />
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
  codeBoxActive: {
    borderColor: colors.mint,
  },
  codeText: {
    color: colors.ink,
    ...typography.h3,
  },
  hiddenInput: {
    height: 0,
    opacity: 0,
    position: 'absolute',
    width: 0,
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
