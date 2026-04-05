import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ChoiceCard } from '@/src/components/forms/ChoiceCard';
import { FormField } from '@/src/components/forms/FormField';
import { WheelNumberPicker } from '@/src/components/forms/WheelNumberPicker';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useAppStore } from '@/src/lib/app-store';
import { onboardingDefaults } from '@/src/features/onboarding/steps';
import { colors, spacing, typography } from '@/src/theme';
import type { VoicePreset } from '@/src/types/domain';

const voiceOptions: { value: VoicePreset; title: string }[] = [
  { value: 'feminine', title: 'Feminine' },
  { value: 'masculine', title: 'Masculine' },
  { value: 'neutral_calm', title: 'Neutral, calm' },
];

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const setDraft = useAppStore((state) => state.setOnboardingDraft);
  const [fullName, setFullName] = useState(draft.fullName ?? onboardingDefaults.fullName);
  const [displayName, setDisplayName] = useState(draft.displayName ?? onboardingDefaults.displayName);
  const [pronouns, setPronouns] = useState(draft.pronouns ?? onboardingDefaults.pronouns);
  const [birthYear, setBirthYear] = useState(draft.birthYear ?? onboardingDefaults.birthYear);
  const [genderIdentity, setGenderIdentity] = useState(draft.genderIdentity ?? onboardingDefaults.genderIdentity);
  const [preferredVoice, setPreferredVoice] = useState<VoicePreset>(draft.preferredVoice ?? onboardingDefaults.preferredVoice);

  const goNext = () => {
    if (new Date().getFullYear() - birthYear < 13) {
      Alert.alert('BubbleAI is 13+', 'For this MVP, BubbleAI is available for ages 13 and older.');
      return;
    }

    setDraft({ fullName, displayName, pronouns, birthYear, genderIdentity, preferredVoice });
    router.push('/(onboarding)/wellness');
  };

  return (
    <Screen>
      <BackHeader />
      <Text style={styles.title}>Tell us about you</Text>
      <View style={styles.form}>
        <FormField label="Full name" value={fullName} onChangeText={setFullName} />
        <FormField label="What should we call you?" value={displayName} onChangeText={setDisplayName} />
        <FormField label="Pronouns, if you want" value={pronouns} onChangeText={setPronouns} />
        <WheelNumberPicker label="Birth year" min={1926} max={new Date().getFullYear() - 13} onChange={setBirthYear} value={birthYear} />
        <Text style={styles.sectionTitle}>Gender identity</Text>
        <View style={styles.stack}>
          {['Female', 'Male', 'Non-binary', 'Prefer not to say'].map((option) => (
            <ChoiceCard
              key={option}
              title={option}
              selected={genderIdentity === option}
              onPress={() => setGenderIdentity(option)}
            />
          ))}
        </View>
        <Text style={styles.sectionTitle}>Preferred voice</Text>
        <View style={styles.stack}>
          {voiceOptions.map((option) => (
            <ChoiceCard
              key={option.value}
              title={option.title}
              selected={preferredVoice === option.value}
              onPress={() => setPreferredVoice(option.value)}
            />
          ))}
        </View>
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
  form: {
    gap: spacing.lg,
  },
  sectionTitle: {
    color: colors.ink,
    ...typography.h3,
  },
  stack: {
    gap: spacing.sm,
  },
});

