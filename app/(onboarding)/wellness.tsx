import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceCard } from '@/src/components/forms/ChoiceCard';
import { FeelingSlider } from '@/src/components/forms/FeelingSlider';
import { WheelNumberPicker } from '@/src/components/forms/WheelNumberPicker';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useAppStore } from '@/src/lib/app-store';
import { onboardingDefaults } from '@/src/features/onboarding/steps';
import { colors, spacing, typography } from '@/src/theme';

export default function OnboardingWellnessScreen() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const setDraft = useAppStore((state) => state.setOnboardingDraft);

  const [feelingToday, setFeelingToday] = useState<1 | 2 | 3 | 4 | 5>(
    (draft.feelingToday ?? onboardingDefaults.feelingToday) as 1 | 2 | 3 | 4 | 5,
  );
  const [stressLevel, setStressLevel] = useState(draft.stressLevel ?? onboardingDefaults.stressLevel);
  const [sleepHours, setSleepHours] = useState(draft.sleepHours ?? onboardingDefaults.sleepHours);
  const [notificationsEnabled, setNotificationsEnabled] = useState(draft.notificationsEnabled ?? onboardingDefaults.notificationsEnabled);
  const [menstrualSupportEnabled, setMenstrualSupportEnabled] = useState(
    draft.menstrualSupportEnabled ?? onboardingDefaults.menstrualSupportEnabled,
  );

  const goNext = () => {
    setDraft({
      feelingToday,
      stressLevel,
      sleepHours,
      notificationsEnabled,
      menstrualSupportEnabled,
    });
    router.push('/(onboarding)/consents');
  };

  return (
    <Screen>
      <BackHeader />
      <Text style={styles.title}>Wellness preferences</Text>
      <Text style={styles.subtitle}>
        This helps BubbleAI understand how you feel today and what kind of support you want.
      </Text>
      <View style={styles.stack}>
        <Text style={styles.sectionTitle}>How are you feeling today?</Text>
        <FeelingSlider value={feelingToday} onChange={setFeelingToday} />
        <WheelNumberPicker label="Stress level (1 to 10)" min={1} max={10} onChange={setStressLevel} value={stressLevel} />
        <WheelNumberPicker label="Sleep hours" min={0} max={12} onChange={setSleepHours} value={sleepHours} />
        <ChoiceCard
          title="Send me gentle reminders"
          description="Daily check-ins, journaling, bedtime, hydration, and movement."
          selected={notificationsEnabled}
          onPress={() => setNotificationsEnabled((current) => !current)}
        />
        <ChoiceCard
          title="I want menstrual wellness support"
          description="Only used if you opt in."
          selected={menstrualSupportEnabled}
          onPress={() => setMenstrualSupportEnabled((current) => !current)}
        />
      </View>
      <PillButton label="Continue" onPress={goNext} style={styles.cta} />
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
  sectionTitle: {
    color: colors.ink,
    ...typography.h3,
  },
  cta: {
    marginTop: spacing.xxxl,
  },
});
