import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { FormField } from '@/src/components/forms/FormField';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useLogin } from '@/src/features/auth/use-auth';
import { colors, spacing, typography } from '@/src/theme';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const login = useLogin();
  const { control, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      router.replace('/');
    } catch (error) {
      Alert.alert('Unable to sign in', error instanceof Error ? error.message : 'Try again.');
    }
  });

  return (
    <Screen>
      <BackHeader trailing={<Text onPress={() => router.push('/(auth)/signup')} style={styles.trailing}>Sign up</Text>} />
      <Text style={styles.title}>Log In</Text>
      <View style={styles.socialRow}>
        {['google', 'apple', 'facebook'].map((icon) => (
          <View key={icon} style={styles.socialCircle}>
            <Feather color={colors.ink} name={icon === 'facebook' ? 'facebook' : icon as never} size={22} />
          </View>
        ))}
      </View>
      <Text style={styles.or}>OR</Text>
      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <FormField
              autoCapitalize="none"
              keyboardType="email-address"
              label="Email"
              onBlur={field.onBlur}
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
            <FormField
              label="Password"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              secureTextEntry
              value={field.value}
              error={fieldState.error?.message}
            />
          )}
        />
        <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={styles.link}>Forgot Password?</Text>
        </Pressable>
      </View>
      <Text style={styles.legal}>
        By logging in, you agree to our privacy terms and understand BubbleAI is supportive AI, not a doctor or crisis line.
      </Text>
      <PillButton disabled={!formState.isValid} label="Login" loading={login.isPending} onPress={onSubmit} />
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
    marginBottom: spacing.lg,
    ...typography.h1,
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  socialCircle: {
    alignItems: 'center',
    backgroundColor: colors.cardStrong,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  or: {
    color: colors.inkMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
    ...typography.label,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  link: {
    color: colors.mint,
    ...typography.body,
  },
  legal: {
    color: colors.inkMuted,
    marginBottom: spacing.xxxl,
    ...typography.caption,
  },
});
