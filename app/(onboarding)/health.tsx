import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceCard } from '@/src/components/forms/ChoiceCard';
import { TokenInputField } from '@/src/components/forms/TokenInputField';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { onboardingDefaults } from '@/src/features/onboarding/steps';
import { useAppStore } from '@/src/lib/app-store';
import { colors, spacing, typography } from '@/src/theme';

export default function OnboardingHealthScreen() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const setDraft = useAppStore((state) => state.setOnboardingDraft);
  const [medicationsEnabled, setMedicationsEnabled] = useState(
    draft.medicationsEnabled ?? onboardingDefaults.medicationsEnabled,
  );
  const [medicationsText, setMedicationsText] = useState(
    draft.medicationsText ?? onboardingDefaults.medicationsText,
  );
  const [symptomsText, setSymptomsText] = useState(draft.symptomsText ?? onboardingDefaults.symptomsText);

  const goNext = () => {
    setDraft({
      medicationsEnabled,
      medicationsText,
      symptomsText,
    });
    router.push('/(onboarding)/habits');
  };

  return (
    <Screen>
      <BackHeader />
      <Text style={styles.title}>Health details</Text>
      <Text style={styles.subtitle}>
        Share only what feels useful. You can keep this lightweight and change it later.
      </Text>
      <View style={styles.stack}>
        <Text style={styles.sectionTitle}>Are you taking any medications?</Text>
        <ChoiceCard
          selected={medicationsEnabled}
          title="Yes, one or multiple"
          onPress={() => setMedicationsEnabled(true)}
        />
        <ChoiceCard
          selected={!medicationsEnabled}
          title="I’m not taking any"
          onPress={() => setMedicationsEnabled(false)}
        />
        {medicationsEnabled ? (
          <TokenInputField
            hint="Type one medication at a time, then tap Save or Done."
            label="Medications"
            onChange={setMedicationsText}
            placeholder="Add a medication"
            value={medicationsText}
          />
        ) : null}
        <TokenInputField
          hint="Type one symptom or diagnosis, then tap Save or Done."
          label="Other symptoms or diagnoses"
          onChange={setSymptomsText}
          placeholder="Add a symptom or diagnosis"
          value={symptomsText}
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
