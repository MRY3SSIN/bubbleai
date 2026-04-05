import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { FormField } from '@/src/components/forms/FormField';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useSignup } from '@/src/features/auth/use-auth';
import { colors, spacing, typography } from '@/src/theme';

const schema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type SignupValues = z.infer<typeof schema>;

export default function SignupScreen() {
  const router = useRouter();
  const signup = useSignup();
  const { control, handleSubmit, formState } = useForm<SignupValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: 'Simar Bhatia',
      email: 'simar@bubbleai.app',
      password: 'BubbleAI123',
      confirmPassword: 'BubbleAI123',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signup.mutateAsync(values);
      router.push({
        pathname: '/(auth)/verify-code',
        params: { email: values.email, context: 'signup' },
      });
    } catch (error) {
      Alert.alert('Unable to create account', error instanceof Error ? error.message : 'Try again.');
    }
  });

  return (
    <Screen>
      <BackHeader trailing={<Text onPress={() => router.push('/(auth)/login')} style={styles.trailing}>Log In</Text>} />
      <Text style={styles.title}>Sign up</Text>
      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field, fieldState }) => (
            <FormField label="Full name" onChangeText={field.onChange} value={field.value} error={fieldState.error?.message} />
          )}
        />
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
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <FormField label="Password" secureTextEntry onChangeText={field.onChange} value={field.value} error={fieldState.error?.message} />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <FormField label="Confirm password" secureTextEntry onChangeText={field.onChange} value={field.value} error={fieldState.error?.message} />
          )}
        />
      </View>
      <Text style={styles.legal}>
        This app supports emotional wellness and practical routines. It does not replace medical care or emergency help.
      </Text>
      <PillButton disabled={!formState.isValid} label="Create account" loading={signup.isPending} onPress={onSubmit} />
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
    marginBottom: spacing.xl,
    ...typography.h1,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  legal: {
    color: colors.inkMuted,
    marginBottom: spacing.xxxl,
    ...typography.caption,
  },
});

