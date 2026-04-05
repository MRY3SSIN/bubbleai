import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/theme';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onPressAction?: () => void;
};

export const SectionHeader = ({ eyebrow, title, actionLabel, onPressAction }: SectionHeaderProps) => (
  <View style={styles.row}>
    <View style={styles.copy}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
    {actionLabel ? (
      <Pressable onPress={onPressAction}>
        <Text style={styles.action}>{actionLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  copy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.mint,
    ...typography.label,
    marginBottom: 4,
  },
  title: {
    color: colors.ink,
    ...typography.h2,
  },
  action: {
    color: colors.inkMuted,
    paddingTop: 4,
    ...typography.label,
  },
});
