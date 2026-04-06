import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/src/components/forms/FormField';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useAppStore } from '@/src/lib/app-store';
import { onboardingDefaults } from '@/src/features/onboarding/steps';
import { colors, spacing, typography } from '@/src/theme';

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const setDraft = useAppStore((state) => state.setOnboardingDraft);
  const [fullName, setFullName] = useState(draft.fullName ?? onboardingDefaults.fullName);
  const [displayName, setDisplayName] = useState(draft.displayName ?? onboardingDefaults.displayName);
  const [pronouns, setPronouns] = useState(draft.pronouns ?? onboardingDefaults.pronouns);

  const goNext = () => {
    if (fullName.trim().length < 2 || displayName.trim().length < 2) {
      Alert.alert('A little more detail', 'Please add your full name and the name you want BubbleAI to use.');
      return;
    }

    setDraft({ fullName, displayName, pronouns });
    router.push('/(onboarding)/identity');
  };

  return (
    <Screen>
      <BackHeader />
      <Text style={styles.title}>Let’s start with your basics</Text>
      <Text style={styles.subtitle}>
        A few simple details help BubbleAI speak to you more naturally.
      </Text>
      <View style={styles.form}>
        <FormField label="Full name" value={fullName} onChangeText={setFullName} />
        <FormField label="What should we call you?" value={displayName} onChangeText={setDisplayName} />
        <FormField label="Pronouns, if you want" value={pronouns} onChangeText={setPronouns} />
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
  form: {
    gap: spacing.lg,
  },
  cta: {
    marginTop: spacing.xxxl,
  },
});
