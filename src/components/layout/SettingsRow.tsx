import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type SettingsRowProps = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

export const SettingsRow = ({ title, subtitle, onPress }: SettingsRowProps) => (
  <Pressable onPress={onPress} style={styles.row}>
    <View style={styles.copy}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    <Feather color={colors.inkMuted} name="chevron-right" size={18} />
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.cardStrong,
    borderRadius: radii.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.ink,
    ...typography.h3,
    fontSize: 18,
  },
  subtitle: {
    color: colors.inkMuted,
    ...typography.caption,
  },
});

