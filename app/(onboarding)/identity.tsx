import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ChoiceCard } from '@/src/components/forms/ChoiceCard';
import { WheelNumberPicker } from '@/src/components/forms/WheelNumberPicker';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { onboardingDefaults } from '@/src/features/onboarding/steps';
import { useAppStore } from '@/src/lib/app-store';
import { colors, spacing, typography } from '@/src/theme';
import type { VoicePreset } from '@/src/types/domain';

const genderOptions = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const voiceOptions: { value: VoicePreset; title: string }[] = [
  { value: 'feminine', title: 'Feminine' },
  { value: 'masculine', title: 'Masculine' },
  { value: 'neutral_calm', title: 'Neutral, calm' },
];

export default function OnboardingIdentityScreen() {
  const router = useRouter();
  const draft = useAppStore((state) => state.onboardingDraft);
  const setDraft = useAppStore((state) => state.setOnboardingDraft);
  const [birthYear, setBirthYear] = useState(draft.birthYear ?? onboardingDefaults.birthYear);
  const [genderIdentity, setGenderIdentity] = useState(
    draft.genderIdentity ?? onboardingDefaults.genderIdentity,
  );
  const [preferredVoice, setPreferredVoice] = useState<VoicePreset>(
    draft.preferredVoice ?? onboardingDefaults.preferredVoice,
  );

  const goNext = () => {
    if (new Date().getFullYear() - birthYear < 13) {
      Alert.alert('BubbleAI is 13+', 'For now, BubbleAI is available for ages 13 and older.');
      return;
    }

    setDraft({ birthYear, genderIdentity, preferredVoice });
    router.push('/(onboarding)/health');
  };

  return (
    <Screen>
      <BackHeader />
      <Text style={styles.title}>A little more about you</Text>
      <Text style={styles.subtitle}>
        This helps us shape the experience and voice in a way that feels more comfortable.
      </Text>
      <View style={styles.stack}>
        <WheelNumberPicker
          label="Birth year"
          max={new Date().getFullYear() - 13}
          min={1926}
          onChange={setBirthYear}
          value={birthYear}
        />
        <Text style={styles.sectionTitle}>Gender identity</Text>
        <View style={styles.choiceStack}>
          {genderOptions.map((option) => (
            <ChoiceCard
              key={option}
              selected={genderIdentity === option}
              title={option}
              onPress={() => setGenderIdentity(option)}
            />
          ))}
        </View>
        <Text style={styles.sectionTitle}>Preferred voice</Text>
        <View style={styles.choiceStack}>
          {voiceOptions.map((option) => (
            <ChoiceCard
              key={option.value}
              selected={preferredVoice === option.value}
              title={option.title}
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
  choiceStack: {
    gap: spacing.sm,
  },
});
