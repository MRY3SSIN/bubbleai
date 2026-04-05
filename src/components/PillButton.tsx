import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type PillButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
};

export const PillButton = ({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: PillButtonProps) => (
  <Pressable
    accessibilityRole="button"
    disabled={disabled || loading}
    onPress={onPress}
    style={({ pressed }) => [
      styles.base,
      variantStyles[variant].container,
      pressed && !disabled && styles.pressed,
      disabled && styles.disabled,
    ]}
  >
    {loading ? (
      <ActivityIndicator color={variantStyles[variant].label.color} />
    ) : (
      <Text style={[styles.label, variantStyles[variant].label]}>{label}</Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 60,
    paddingHorizontal: spacing.xl,
  },
  label: {
    ...typography.h3,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.55,
  },
});

const variantStyles = {
  primary: StyleSheet.create({
    container: {
      backgroundColor: colors.ink,
    },
    label: {
      color: colors.white,
    },
  }),
  secondary: StyleSheet.create({
    container: {
      backgroundColor: colors.cardStrong,
      borderColor: colors.border,
      borderWidth: 1,
    },
    label: {
      color: colors.ink,
    },
  }),
  ghost: StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
    },
    label: {
      color: colors.mint,
    },
  }),
  danger: StyleSheet.create({
    container: {
      backgroundColor: colors.danger,
    },
    label: {
      color: colors.white,
    },
  }),
};

