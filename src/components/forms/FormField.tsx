import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type FormFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
};

export const FormField = ({ label, hint, error, multiline, style, ...props }: FormFieldProps) => (
  <View style={styles.wrapper}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholderTextColor={colors.inkMuted}
      style={[styles.input, multiline && styles.multiline, style]}
      multiline={multiline}
      {...props}
    />
    {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    color: colors.inkMuted,
    ...typography.label,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    ...typography.body,
  },
  multiline: {
    minHeight: 128,
    paddingTop: spacing.lg,
    textAlignVertical: 'top',
  },
  hint: {
    color: colors.inkMuted,
    ...typography.caption,
  },
  error: {
    color: colors.danger,
    ...typography.caption,
  },
});

