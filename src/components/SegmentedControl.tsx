import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type Segment<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

export const SegmentedControl = <T extends string>({
  segments,
  value,
  onChange,
}: SegmentedControlProps<T>) => (
  <View style={styles.container}>
    {segments.map((segment) => {
      const active = segment.value === value;
      return (
        <Pressable
          key={segment.value}
          onPress={() => onChange(segment.value)}
          style={[styles.segment, active && styles.segmentActive]}
        >
          <Text style={[styles.label, active && styles.labelActive]}>{segment.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardStrong,
    borderRadius: radii.pill,
    flexDirection: 'row',
    padding: 4,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  segmentActive: {
    backgroundColor: colors.mint,
  },
  label: {
    color: colors.inkMuted,
    ...typography.label,
  },
  labelActive: {
    color: colors.white,
  },
});

