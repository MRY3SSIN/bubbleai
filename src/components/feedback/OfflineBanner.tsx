import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

export const OfflineBanner = () => (
  <View style={styles.banner}>
    <Feather color={colors.ink} name="wifi-off" size={18} />
    <Text style={styles.text}>You are offline. BubbleAI can still run in mock mode while you reconnect.</Text>
  </View>
);

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    backgroundColor: colors.cardStrong,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    color: colors.ink,
    flex: 1,
    ...typography.caption,
  },
});

