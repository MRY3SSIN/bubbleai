import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type TypingBubbleProps = {
  label?: string;
};

export const TypingBubble = ({ label = 'BubbleAI' }: TypingBubbleProps) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => (current + 1) % 3);
    }, 320);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.bubble}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                opacity: step === index ? 1 : 0.28,
                transform: [{ scale: step === index ? 1 : 0.86 }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.inkMuted,
    marginBottom: spacing.xs,
    ...typography.caption,
  },
  bubble: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.cardStrong,
    borderRadius: radii.lg,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dot: {
    backgroundColor: colors.mintDeep,
    borderRadius: radii.pill,
    height: 10,
    width: 10,
  },
});
