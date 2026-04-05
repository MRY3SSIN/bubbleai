import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text } from 'react-native';
import { z } from 'zod';

import { FormField } from '@/src/components/forms/FormField';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useResetPassword } from '@/src/features/auth/use-auth';
import { colors, spacing, typography } from '@/src/theme';

const schema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type Values = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const mutation = useResetPassword();
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: 'BubbleAI123',
      confirmPassword: 'BubbleAI123',
    },
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    try {
      await mutation.mutateAsync({ password });
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Unable to reset password', error instanceof Error ? error.message : 'Try again.');
    }
  });

  return (
    <Screen>
      <BackHeader title="Reset Password" />
      <Text style={styles.subtitle}>Choose a password you can remember and keep safe.</Text>
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <FormField label="New password" secureTextEntry onChangeText={field.onChange} value={field.value} error={fieldState.error?.message} />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <FormField
            label="Confirm password"
            secureTextEntry
            onChangeText={field.onChange}
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />
      <PillButton
        disabled={!formState.isValid}
        label="Save Password"
        loading={mutation.isPending}
        onPress={onSubmit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    color: colors.inkMuted,
    marginBottom: spacing.xl,
    ...typography.body,
  },
});

