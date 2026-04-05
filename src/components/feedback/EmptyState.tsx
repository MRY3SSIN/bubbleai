import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/theme';

type EmptyStateProps = {
  title: string;
  description: string;
};

export const EmptyState = ({ title, description }: EmptyStateProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  title: {
    color: colors.ink,
    ...typography.h3,
  },
  description: {
    color: colors.inkMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
    ...typography.body,
  },
});

