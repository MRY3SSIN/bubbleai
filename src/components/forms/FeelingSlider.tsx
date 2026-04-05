import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type FeelingSliderProps = {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (value: 1 | 2 | 3 | 4 | 5) => void;
};

const moods = [
  { value: 1, emoji: '😔', label: 'Not pleasant' },
  { value: 2, emoji: '😕', label: 'A bit low' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Pretty good' },
  { value: 5, emoji: '😁', label: 'Very pleasant' },
] as const;

export const FeelingSlider = ({ value, onChange }: FeelingSliderProps) => {
  const selected = moods.find((mood) => mood.value === value) ?? moods[2];

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{selected.emoji}</Text>
      <Text style={styles.label}>{selected.label}</Text>
      <View style={styles.track}>
        {moods.map((mood) => (
          <Pressable
            key={mood.value}
            onPress={() => onChange(mood.value)}
            style={[styles.dot, mood.value === value && styles.dotActive]}
          />
        ))}
      </View>
      <View style={styles.row}>
        <Text style={styles.edgeEmoji}>😔</Text>
        <Text style={styles.edgeEmoji}>😁</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  emoji: {
    fontSize: 62,
  },
  label: {
    color: colors.ink,
    ...typography.h3,
  },
  track: {
    alignItems: 'center',
    backgroundColor: colors.cardStrong,
    borderRadius: radii.pill,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  dot: {
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    height: 16,
    marginVertical: spacing.md,
    width: 16,
  },
  dotActive: {
    backgroundColor: colors.mint,
    height: 28,
    width: 28,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  edgeEmoji: {
    fontSize: 24,
  },
});

