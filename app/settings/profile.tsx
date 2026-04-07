import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { DropdownField } from '@/src/components/forms/DropdownField';
import { FormField } from '@/src/components/forms/FormField';
import { TokenInputField } from '@/src/components/forms/TokenInputField';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useProfile, useUpdateProfile } from '@/src/features/profile/use-profile';
import { dataService } from '@/src/lib/data-service';
import {
  drinkingHabitOptions,
  smokingHabitOptions,
} from '@/src/features/onboarding/steps';
import { colors, radii, spacing, typography } from '@/src/theme';
import type { AvatarTheme, VoicePreset } from '@/src/types/domain';

const voiceOptions: { label: string; value: VoicePreset }[] = [
  { label: 'Feminine', value: 'feminine' },
  { label: 'Masculine', value: 'masculine' },
  { label: 'Neutral, calm', value: 'neutral_calm' },
];

const avatarThemes: { value: AvatarTheme; label: string; color: string }[] = [
  { value: 'mint', label: 'Mint', color: colors.cardStrong },
  { value: 'ocean', label: 'Ocean', color: '#D9EDF9' },
  { value: 'sunrise', label: 'Sunrise', color: '#FCE8D8' },
  { value: 'lavender', label: 'Lavender', color: '#ECE7FB' },
  { value: 'forest', label: 'Forest', color: '#DDEDE6' },
];

type ProfileFormState = {
  fullName: string;
  displayName: string;
  pronouns: string;
  birthYear: string;
  genderIdentity: string;
  preferredVoice: VoicePreset;
  avatarPath?: string;
  avatarTheme: AvatarTheme;
  avatarUrl?: string;
  smokingHabits: string;
  drinkingHabits: string;
  medicationsText: string;
  symptomsText: string;
};

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState<ProfileFormState>({
    fullName: '',
    displayName: '',
    pronouns: '',
    birthYear: '',
    genderIdentity: '',
    preferredVoice: 'neutral_calm',
    avatarTheme: 'mint',
    smokingHabits: 'None',
    drinkingHabits: 'Rarely',
    medicationsText: '',
    symptomsText: '',
  });

  useEffect(() => {
    if (!profile) {
      return;
    }

    setForm({
      fullName: profile.fullName,
      displayName: profile.displayName,
      pronouns: profile.pronouns ?? '',
      birthYear: profile.birthYear ? String(profile.birthYear) : '',
      genderIdentity: profile.genderIdentity ?? '',
      preferredVoice: profile.preferredVoice,
      avatarPath: profile.avatarPath,
      avatarTheme: profile.avatarTheme ?? 'mint',
      avatarUrl: profile.avatarUrl,
      smokingHabits: profile.smokingHabits ?? 'None',
      drinkingHabits: profile.drinkingHabits ?? 'Rarely',
      medicationsText: profile.medications?.join(', ') ?? '',
      symptomsText: profile.diagnoses?.join(', ') ?? '',
    });
  }, [profile]);

  const updateField = <T extends keyof ProfileFormState>(key: T, value: ProfileFormState[T]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const pickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photos permission needed', 'Please allow photo access to choose a profile image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ['images'],
        quality: 0.72,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      const avatar = await dataService.uploadAvatar(result.assets[0].uri);
      updateField('avatarPath', avatar.avatarPath);
      updateField('avatarUrl', avatar.avatarUrl);
    } catch (error) {
      Alert.alert(
        'Unable to update photo',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const save = async () => {
    try {
      await updateProfile.mutateAsync({
        fullName: form.fullName.trim(),
        displayName: form.displayName.trim(),
        pronouns: form.pronouns.trim() || undefined,
        birthYear: form.birthYear ? Number(form.birthYear) : undefined,
        genderIdentity: form.genderIdentity.trim() || undefined,
        preferredVoice: form.preferredVoice,
        avatarPath: form.avatarPath,
        avatarTheme: form.avatarTheme,
        avatarUrl: form.avatarUrl,
        smokingHabits: form.smokingHabits,
        drinkingHabits: form.drinkingHabits,
        medicationsText: form.medicationsText,
        symptomsText: form.symptomsText,
      });
      Alert.alert('Saved', 'Your profile was updated.');
      router.back();
    } catch (error) {
      Alert.alert('Unable to save profile', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <Screen>
      <BackHeader title="Edit profile" />

      <View style={styles.avatarSection}>
        <Avatar
          name={form.fullName || form.displayName || 'BubbleAI User'}
          size={96}
          theme={form.avatarTheme}
          uri={form.avatarUrl}
        />
        <View style={styles.avatarActions}>
          <PillButton label="Upload photo" onPress={pickPhoto} variant="secondary" />
        </View>
        <Text style={styles.avatarLabel}>Or choose a softer avatar style</Text>
        <View style={styles.themeRow}>
          {avatarThemes.map((theme) => {
            const active = form.avatarTheme === theme.value;

            return (
              <Pressable
                key={theme.value}
                onPress={() => updateField('avatarTheme', theme.value)}
                style={[styles.themeChip, active && styles.themeChipActive]}
              >
                <View style={[styles.themeDot, { backgroundColor: theme.color }]} />
                <Text style={[styles.themeLabel, active && styles.themeLabelActive]}>{theme.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.form}>
        <FormField label="Full name" value={form.fullName} onChangeText={(value) => updateField('fullName', value)} />
        <FormField label="Display name" value={form.displayName} onChangeText={(value) => updateField('displayName', value)} />
        <FormField label="Pronouns" value={form.pronouns} onChangeText={(value) => updateField('pronouns', value)} />
        <FormField
          keyboardType="number-pad"
          label="Birth year"
          value={form.birthYear}
          onChangeText={(value) => updateField('birthYear', value.replace(/[^0-9]/g, ''))}
        />
        <FormField label="Gender identity" value={form.genderIdentity} onChangeText={(value) => updateField('genderIdentity', value)} />
        <DropdownField
          label="Preferred voice"
          options={voiceOptions}
          value={form.preferredVoice}
          onChange={(value) => updateField('preferredVoice', value as VoicePreset)}
        />
        <DropdownField
          label="Smoking habits"
          options={smokingHabitOptions}
          value={form.smokingHabits}
          onChange={(value) => updateField('smokingHabits', value)}
        />
        <DropdownField
          label="Drinking habits"
          options={drinkingHabitOptions}
          value={form.drinkingHabits}
          onChange={(value) => updateField('drinkingHabits', value)}
        />
        <TokenInputField
          label="Medications"
          hint="Type one medication at a time, then tap Save."
          placeholder="Add a medication"
          value={form.medicationsText}
          onChange={(value) => updateField('medicationsText', value)}
        />
        <TokenInputField
          label="Symptoms or diagnoses"
          hint="Type one item at a time, then tap Save."
          placeholder="Add a symptom or diagnosis"
          value={form.symptomsText}
          onChange={(value) => updateField('symptomsText', value)}
        />
      </View>

      <PillButton label="Save profile" loading={updateProfile.isPending} onPress={save} style={styles.saveButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarActions: {
    marginTop: spacing.md,
    width: '100%',
  },
  avatarLabel: {
    color: colors.inkMuted,
    marginTop: spacing.md,
    ...typography.caption,
  },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  themeChip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  themeChipActive: {
    backgroundColor: colors.cardStrong,
    borderColor: colors.mint,
  },
  themeDot: {
    borderRadius: 999,
    height: 16,
    width: 16,
  },
  themeLabel: {
    color: colors.inkMuted,
    ...typography.label,
  },
  themeLabelActive: {
    color: colors.ink,
  },
  form: {
    gap: spacing.lg,
  },
  saveButton: {
    marginTop: spacing.xxl,
  },
});
