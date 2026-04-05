import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceCard } from '@/src/components/forms/ChoiceCard';
import { FeelingSlider } from '@/src/components/forms/FeelingSlider';
import { FormField } from '@/src/components/forms/FormField';
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

  const [medicationsEnabled, setMedicationsEnabled] = useState(draft.medicationsEnabled ?? onboardingDefaults.medicationsEnabled);
  const [medicationsText, setMedicationsText] = useState(draft.medicationsText ?? onboardingDefaults.medicationsText);
  const [symptomsText, setSymptomsText] = useState(draft.symptomsText ?? onboardingDefaults.symptomsText);
  const [smokingHabits, setSmokingHabits] = useState(draft.smokingHabits ?? onboardingDefaults.smokingHabits);
  const [drinkingHabits, setDrinkingHabits] = useState(draft.drinkingHabits ?? onboardingDefaults.drinkingHabits);
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
      medicationsEnabled,
      medicationsText,
      symptomsText,
      smokingHabits,
      drinkingHabits,
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
      <View style={styles.stack}>
        <Text style={styles.sectionTitle}>Are you taking any medications?</Text>
        <ChoiceCard
          title="Yes, one or multiple"
          selected={medicationsEnabled}
          onPress={() => setMedicationsEnabled(true)}
        />
        <ChoiceCard
          title="I’m not taking any"
          selected={!medicationsEnabled}
          onPress={() => setMedicationsEnabled(false)}
        />
        {medicationsEnabled ? (
          <FormField
            hint="Comma separated, optional"
            label="Please specify your medications"
            value={medicationsText}
            onChangeText={setMedicationsText}
          />
        ) : null}
        <FormField
          hint="Optional"
          label="Other symptoms or diagnoses"
          value={symptomsText}
          onChangeText={setSymptomsText}
        />
        <FormField label="Smoking habits" value={smokingHabits} onChangeText={setSmokingHabits} />
        <FormField label="Drinking habits" value={drinkingHabits} onChangeText={setDrinkingHabits} />
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
      <PillButton label="Continue" onPress={goNext} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    marginBottom: spacing.xl,
    ...typography.h1,
  },
  stack: {
    gap: spacing.lg,
  },
  sectionTitle: {
    color: colors.ink,
    ...typography.h3,
  },
});
