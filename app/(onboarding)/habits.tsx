import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { DropdownField } from '@/src/components/forms/DropdownField';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import {
  drinkingHabitOptions,
  onboardingDefaults,
  smokingHabitOptions,
} from '@/src/features/onboarding/steps';
import { useAppStore } from '@/src/lib/app-store';
import { colors, spacing, typography } from '@/src/theme';

export default function OnboardingHabitsScreen() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const setDraft = useAppStore((state) => state.setOnboardingDraft);
  const smokingHabits = draft.smokingHabits ?? onboardingDefaults.smokingHabits;
  const drinkingHabits = draft.drinkingHabits ?? onboardingDefaults.drinkingHabits;

  return (
    <Screen>
      <BackHeader />
      <Text style={styles.title}>Lifestyle habits</Text>
      <Text style={styles.subtitle}>
        These details help BubbleAI offer more realistic routines and suggestions.
      </Text>
      <View style={styles.stack}>
        <DropdownField
          label="Smoking habits"
          onChange={(value) => setDraft({ smokingHabits: value })}
          options={smokingHabitOptions}
          value={smokingHabits}
        />
        <DropdownField
          label="Drinking habits"
          onChange={(value) => setDraft({ drinkingHabits: value })}
          options={drinkingHabitOptions}
          value={drinkingHabits}
        />
      </View>
      <PillButton
        label="Continue"
        onPress={() => router.push('/(onboarding)/wellness')}
        style={styles.cta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    marginBottom: spacing.md,
    ...typography.h1,
  },
  subtitle: {
    color: colors.inkMuted,
    marginBottom: spacing.xl,
    ...typography.body,
  },
  stack: {
    gap: spacing.lg,
  },
  cta: {
    marginTop: spacing.xxxl,
  },
});
