import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/AppCard';
import { colors, spacing, typography } from '@/src/theme';

type MetricTileProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
};

export const MetricTile = ({ title, value, subtitle, icon }: MetricTileProps) => (
  <AppCard style={styles.card}>
    <View style={styles.iconCircle}>
      <Text style={styles.icon}>{icon}</Text>
    </View>
    <Text numberOfLines={2} style={styles.title}>
      {title}
    </Text>
    <Text numberOfLines={2} style={styles.value}>
      {value}
    </Text>
    <Text numberOfLines={4} style={styles.subtitle}>
      {subtitle}
    </Text>
  </AppCard>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 164,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 40,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    color: colors.ink,
    flexShrink: 1,
    ...typography.h3,
    fontSize: 20,
    lineHeight: 24,
  },
  value: {
    color: colors.mint,
    flexShrink: 1,
    ...typography.h1,
    fontSize: 32,
    lineHeight: 36,
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.inkMuted,
    flexShrink: 1,
    ...typography.caption,
    marginTop: spacing.sm,
  },
});
