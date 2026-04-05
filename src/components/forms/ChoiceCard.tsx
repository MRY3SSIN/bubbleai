import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type ChoiceCardProps = {
  title: string;
  description?: string;
  selected: boolean;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
};

export const ChoiceCard = ({
  title,
  description,
  selected,
  icon = 'circle',
  onPress,
}: ChoiceCardProps) => (
  <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]}>
    <View style={styles.leading}>
      <View style={[styles.iconCircle, selected && styles.iconCircleActive]}>
        <Feather color={colors.ink} name={icon} size={20} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
    </View>
    <View style={[styles.radio, selected && styles.radioSelected]} />
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 84,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  selected: {
    backgroundColor: colors.cardStrong,
  },
  leading: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: spacing.md,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconCircleActive: {
    backgroundColor: colors.mintSoft,
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
  description: {
    color: colors.inkMuted,
    ...typography.caption,
  },
  radio: {
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 20,
    width: 20,
  },
  radioSelected: {
    borderColor: colors.mint,
  },
});

