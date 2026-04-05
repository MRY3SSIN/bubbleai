import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';
import type { RiskLevel } from '@/src/types/domain';

type RiskBannerProps = {
  level: RiskLevel;
  title: string;
  description: string;
};

export const RiskBanner = ({ level, title, description }: RiskBannerProps) => (
  <View style={[styles.base, levelStyles[level]]}>
    <Feather color={level === 'red' ? colors.danger : level === 'yellow' ? colors.warning : colors.mint} name="alert-circle" size={20} />
    <View style={styles.copy}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.ink,
    ...typography.h3,
  },
  description: {
    color: colors.inkMuted,
    ...typography.body,
  },
});

const levelStyles = StyleSheet.create({
  green: {
    backgroundColor: colors.card,
  },
  yellow: {
    backgroundColor: '#FFF6DD',
  },
  red: {
    backgroundColor: colors.dangerSoft,
  },
});

