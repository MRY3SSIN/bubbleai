import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownFieldProps = {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
};

export const DropdownField = ({
  label,
  options,
  value,
  onChange,
}: DropdownFieldProps) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen((current) => !current)} style={styles.trigger}>
        <Text style={styles.value}>{selected?.label ?? 'Select an option'}</Text>
        <Feather color={colors.inkMuted} name={open ? 'chevron-up' : 'chevron-down'} size={18} />
      </Pressable>
      {open ? (
        <View style={styles.menu}>
          {options.map((option) => {
            const active = option.value === value;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={[styles.option, active && styles.optionActive]}
              >
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    color: colors.inkMuted,
    ...typography.label,
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.lg,
  },
  value: {
    color: colors.ink,
    ...typography.body,
  },
  menu: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  optionActive: {
    backgroundColor: colors.cardStrong,
  },
  optionLabel: {
    color: colors.ink,
    ...typography.body,
  },
  optionLabelActive: {
    color: colors.mintDeep,
    fontFamily: 'Manrope_600SemiBold',
  },
});
