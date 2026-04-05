import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing } from '@/src/theme';

type AppCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  accent?: boolean;
}>;

export const AppCard = ({ children, style, accent = false }: AppCardProps) => (
  <View style={[styles.base, accent && styles.accent, style]}>{children}</View>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  accent: {
    backgroundColor: colors.cardStrong,
  },
});
