import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type WheelNumberPickerProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

export const WheelNumberPicker = ({ label, value, min, max, onChange }: WheelNumberPickerProps) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.wheel}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepper}>
        <Feather color={colors.inkMuted} name="minus" size={22} />
      </Pressable>
      <View style={styles.valueChip}>
        <Text style={styles.valueText}>{String(value).padStart(2, '0')}</Text>
      </View>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepper}>
        <Feather color={colors.inkMuted} name="plus" size={22} />
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  label: {
    color: colors.ink,
    textAlign: 'center',
    ...typography.h1,
  },
  wheel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  valueChip: {
    alignItems: 'center',
    backgroundColor: colors.cardStrong,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    height: 140,
    justifyContent: 'center',
    width: 180,
  },
  valueText: {
    color: colors.mint,
    ...typography.display,
    fontSize: 72,
  },
  stepper: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
});

