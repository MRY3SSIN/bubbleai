import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ChoiceCard } from '@/src/components/forms/ChoiceCard';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useAppStore } from '@/src/lib/app-store';
import { dataService } from '@/src/lib/data-service';
import { onboardingDefaults, onboardingSchema } from '@/src/features/onboarding/steps';
import { colors, spacing, typography } from '@/src/theme';
import type { OnboardingFormValues } from '@/src/types/domain';

export default function OnboardingConsentsScreen() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const [privacyAccepted, setPrivacyAccepted] = useState(draft.privacyAccepted ?? onboardingDefaults.privacyAccepted);
  const [aiDisclaimerAccepted, setAiDisclaimerAccepted] = useState(
    draft.aiDisclaimerAccepted ?? onboardingDefaults.aiDisclaimerAccepted,
  );
  const [crisisDisclaimerAccepted, setCrisisDisclaimerAccepted] = useState(
    draft.crisisDisclaimerAccepted ?? onboardingDefaults.crisisDisclaimerAccepted,
  );

  const complete = async () => {
    const payload: OnboardingFormValues = {
      fullName: draft.fullName ?? onboardingDefaults.fullName,
      displayName: draft.displayName ?? onboardingDefaults.displayName,
      pronouns: draft.pronouns ?? onboardingDefaults.pronouns,
      birthYear: draft.birthYear ?? onboardingDefaults.birthYear,
      genderIdentity: draft.genderIdentity ?? onboardingDefaults.genderIdentity,
      preferredVoice: draft.preferredVoice ?? onboardingDefaults.preferredVoice,
      medicationsEnabled: draft.medicationsEnabled ?? onboardingDefaults.medicationsEnabled,
      medicationsText: draft.medicationsText ?? onboardingDefaults.medicationsText,
      symptomsText: draft.symptomsText ?? onboardingDefaults.symptomsText,
      smokingHabits: draft.smokingHabits ?? onboardingDefaults.smokingHabits,
      drinkingHabits: draft.drinkingHabits ?? onboardingDefaults.drinkingHabits,
      feelingToday: (draft.feelingToday ?? onboardingDefaults.feelingToday) as 1 | 2 | 3 | 4 | 5,
      stressLevel: draft.stressLevel ?? onboardingDefaults.stressLevel,
      sleepHours: draft.sleepHours ?? onboardingDefaults.sleepHours,
      notificationsEnabled: draft.notificationsEnabled ?? onboardingDefaults.notificationsEnabled,
      menstrualSupportEnabled:
        draft.menstrualSupportEnabled ?? onboardingDefaults.menstrualSupportEnabled,
      privacyAccepted,
      aiDisclaimerAccepted,
      crisisDisclaimerAccepted,
    };

    const parsed = onboardingSchema.safeParse(payload);

    if (!parsed.success) {
      Alert.alert('Almost there', 'Please complete the required onboarding details before continuing.');
      return;
    }

    await dataService.completeOnboarding(parsed.data);
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <BackHeader />
      <Text style={styles.title}>Safety and privacy</Text>
      <View style={styles.stack}>
        <ChoiceCard
          title="I accept the privacy consent"
          description="Your wellness data stays in your private account unless you choose to share it."
          selected={privacyAccepted}
          onPress={() => setPrivacyAccepted((current) => !current)}
        />
        <ChoiceCard
          title="I understand BubbleAI is AI support"
          description="BubbleAI is not a human therapist and does not replace professional care."
          selected={aiDisclaimerAccepted}
          onPress={() => setAiDisclaimerAccepted((current) => !current)}
        />
        <ChoiceCard
          title="I understand the crisis disclaimer"
          description="If there is self-harm or suicide risk, BubbleAI will shift toward immediate human help."
          selected={crisisDisclaimerAccepted}
          onPress={() => setCrisisDisclaimerAccepted((current) => !current)}
        />
      </View>
      <PillButton label="Finish onboarding" onPress={complete} style={styles.cta} />
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
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  cta: {
    marginTop: spacing.lg,
  },
});
