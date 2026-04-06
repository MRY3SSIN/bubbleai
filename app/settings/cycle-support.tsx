import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { AppCard } from '@/src/components/AppCard';
import { FormField } from '@/src/components/forms/FormField';
import { TokenInputField } from '@/src/components/forms/TokenInputField';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useCycleProfile, useSaveCycleProfile } from '@/src/features/profile/use-profile';
import { getCycleInsight } from '@/src/lib/cycle-support';
import { colors, spacing, typography } from '@/src/theme';
import type { CycleProfile } from '@/src/types/domain';

type CycleFormState = {
  enabled: boolean;
  lastPeriodStart: string;
  cycleLengthDays: string;
  periodLengthDays: string;
  irregularCycles: boolean;
  symptomsText: string;
  notes: string;
};

const createFormState = (cycleProfile?: CycleProfile | null): CycleFormState => ({
  enabled: cycleProfile?.enabled ?? false,
  lastPeriodStart: cycleProfile?.lastPeriodStart ?? '',
  cycleLengthDays: String(cycleProfile?.cycleLengthDays ?? 28),
  periodLengthDays: String(cycleProfile?.periodLengthDays ?? 5),
  irregularCycles: cycleProfile?.irregularCycles ?? false,
  symptomsText: cycleProfile?.symptoms?.join(', ') ?? '',
  notes: cycleProfile?.notes ?? '',
});

export default function CycleSupportScreen() {
  const router = useRouter();
  const { data: cycleProfile } = useCycleProfile();
  const saveCycleProfile = useSaveCycleProfile();
  const [form, setForm] = useState<CycleFormState>(createFormState());

  useEffect(() => {
    setForm(createFormState(cycleProfile));
  }, [cycleProfile]);

  const updateField = <T extends keyof CycleFormState>(key: T, value: CycleFormState[T]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const previewInsight = useMemo(
    () =>
      getCycleInsight({
        enabled: form.enabled,
        lastPeriodStart: form.lastPeriodStart || undefined,
        cycleLengthDays: Number(form.cycleLengthDays || 28),
        periodLengthDays: Number(form.periodLengthDays || 5),
        irregularCycles: form.irregularCycles,
        symptoms: form.symptomsText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        notes: form.notes.trim() || undefined,
      }),
    [form],
  );

  const save = async () => {
    const cycleLengthDays = Number(form.cycleLengthDays || 0);
    const periodLengthDays = Number(form.periodLengthDays || 0);

    if (form.lastPeriodStart && !/^\d{4}-\d{2}-\d{2}$/.test(form.lastPeriodStart)) {
      Alert.alert('Use YYYY-MM-DD', 'Last period start should look like 2026-04-06.');
      return;
    }

    if (cycleLengthDays < 21 || cycleLengthDays > 45) {
      Alert.alert('Cycle length looks off', 'Please choose a cycle length between 21 and 45 days.');
      return;
    }

    if (periodLengthDays < 1 || periodLengthDays > 10) {
      Alert.alert('Period length looks off', 'Please choose a period length between 1 and 10 days.');
      return;
    }

    try {
      await saveCycleProfile.mutateAsync({
        enabled: form.enabled,
        lastPeriodStart: form.lastPeriodStart || undefined,
        cycleLengthDays,
        periodLengthDays,
        irregularCycles: form.irregularCycles,
        symptoms: form.symptomsText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        notes: form.notes.trim() || undefined,
      });

      Alert.alert('Saved', 'Cycle-aware support was updated.');
      router.back();
    } catch (error) {
      Alert.alert(
        'Unable to save cycle support',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  return (
    <Screen>
      <BackHeader title="Cycle-aware support" />

      <AppCard accent style={styles.toggleCard}>
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.cardTitle}>Menstrual wellness support</Text>
            <Text style={styles.cardBody}>
              BubbleAI can adapt tone and suggestions around lower-energy or more sensitive cycle phases if you opt in.
            </Text>
          </View>
          <Switch
            onValueChange={(value) => updateField('enabled', value)}
            thumbColor={colors.white}
            trackColor={{ false: colors.border, true: colors.mint }}
            value={form.enabled}
          />
        </View>
      </AppCard>

      <View style={styles.form}>
        <FormField
          autoCapitalize="none"
          hint="Optional. Use YYYY-MM-DD."
          label="Last period start"
          placeholder="2026-04-06"
          value={form.lastPeriodStart}
          onChangeText={(value) => updateField('lastPeriodStart', value.trim())}
        />
        <FormField
          keyboardType="number-pad"
          label="Typical cycle length"
          value={form.cycleLengthDays}
          onChangeText={(value) => updateField('cycleLengthDays', value.replace(/[^0-9]/g, ''))}
        />
        <FormField
          keyboardType="number-pad"
          label="Typical period length"
          value={form.periodLengthDays}
          onChangeText={(value) => updateField('periodLengthDays', value.replace(/[^0-9]/g, ''))}
        />
        <AppCard>
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.cardTitle}>Irregular cycles</Text>
              <Text style={styles.cardBody}>
                Turn this on if your cycle timing changes a lot month to month.
              </Text>
            </View>
            <Switch
              onValueChange={(value) => updateField('irregularCycles', value)}
              thumbColor={colors.white}
              trackColor={{ false: colors.border, true: colors.mint }}
              value={form.irregularCycles}
            />
          </View>
        </AppCard>
        <TokenInputField
          hint="Optional. Add one symptom at a time."
          label="Common symptoms"
          placeholder="Cramps, bloating, headaches"
          value={form.symptomsText}
          onChange={(value) => updateField('symptomsText', value)}
        />
        <FormField
          hint="Optional. Tell BubbleAI anything that helps support feel safer or gentler."
          label="Notes for BubbleAI"
          multiline
          value={form.notes}
          onChangeText={(value) => updateField('notes', value)}
        />
      </View>

      <AppCard style={styles.previewCard}>
        <Text style={styles.cardTitle}>
          {previewInsight?.title ?? 'How cycle-aware support will feel'}
        </Text>
        <Text style={styles.cardBody}>
          {previewInsight?.body ??
            'Once you add your cycle details, BubbleAI can offer calmer pacing, gentler routines, and more context-aware suggestions.'}
        </Text>
      </AppCard>

      <PillButton
        label="Save cycle support"
        loading={saveCycleProfile.isPending}
        onPress={save}
        style={styles.saveButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleCard: {
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
  },
  cardTitle: {
    color: colors.ink,
    ...typography.h3,
  },
  cardBody: {
    color: colors.inkMuted,
    marginTop: spacing.sm,
    ...typography.body,
  },
  previewCard: {
    marginTop: spacing.xl,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});
