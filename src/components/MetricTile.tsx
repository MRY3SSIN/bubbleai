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
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </AppCard>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 144,
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
    ...typography.h3,
  },
  value: {
    color: colors.mint,
    ...typography.h1,
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.inkMuted,
    ...typography.caption,
    marginTop: spacing.sm,
  },
});

