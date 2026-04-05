import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text } from 'react-native';
import { z } from 'zod';

import { FormField } from '@/src/components/forms/FormField';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useForgotPassword } from '@/src/features/auth/use-auth';
import { colors, spacing, typography } from '@/src/theme';

const schema = z.object({
  email: z.string().email(),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const mutation = useForgotPassword();
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'simar@bubbleai.app' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await mutation.mutateAsync(email);
      router.push({ pathname: '/(auth)/verify-code', params: { email, context: 'forgot' } });
    } catch (error) {
      Alert.alert('Unable to send code', error instanceof Error ? error.message : 'Try again.');
    }
  });

  return (
    <Screen>
      <BackHeader trailing={<Text onPress={() => router.push('/(auth)/signup')} style={styles.trailing}>Sign up</Text>} />
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>No worries, we’ve got you covered.</Text>
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <FormField
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email"
            onChangeText={field.onChange}
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />
      <PillButton
        disabled={!formState.isValid}
        label="Send Verification Code"
        loading={mutation.isPending}
        onPress={onSubmit}
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
});

