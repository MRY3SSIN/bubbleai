import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { DropdownField } from '@/src/components/forms/DropdownField';
import { FormField } from '@/src/components/forms/FormField';
import { SearchSelectField } from '@/src/components/forms/SearchSelectField';
import { TokenInputField } from '@/src/components/forms/TokenInputField';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useMedicalId, useSaveMedicalId } from '@/src/features/profile/use-profile';
import {
  bloodTypeOptions,
  commonAllergies,
  sortedMalaysiaClinicDirectory,
} from '@/src/lib/medical-reference';
import { colors, spacing, typography } from '@/src/theme';
import type { MedicalId } from '@/src/types/domain';

export default function MedicalIdScreen() {
  const router = useRouter();
  const { data } = useMedicalId();
  const saveMedicalId = useSaveMedicalId();
  const [form, setForm] = useState<MedicalId>({
    bloodType: '',
    allergies: '',
    conditions: '',
    medications: '',
    notes: '',
    clinicianName: '',
    clinicianPhone: '',
    clinicianAddress: '',
    clinicianMapsUrl: '',
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    setForm({
      bloodType: data.bloodType ?? '',
      allergies: data.allergies ?? '',
      conditions: data.conditions ?? '',
      medications: data.medications ?? '',
      notes: data.notes ?? '',
      clinicianName: data.clinicianName ?? '',
      clinicianPhone: data.clinicianPhone ?? '',
      clinicianAddress: data.clinicianAddress ?? '',
      clinicianMapsUrl: data.clinicianMapsUrl ?? '',
    });
  }, [data]);

  const updateField = <T extends keyof MedicalId>(key: T, value: MedicalId[T]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const clinicOptions = sortedMalaysiaClinicDirectory.map((clinic) => ({
    label: clinic.name,
    value: clinic.name,
    description: `${clinic.type === 'health_clinic' ? 'Health clinic' : clinic.type === 'private_hospital' ? 'Private hospital' : 'Government hospital'} • ${clinic.state}`,
    keywords: `${clinic.address ?? ''} ${clinic.phone ?? ''} ${clinic.state}`,
  }));

  const applyClinicSelection = (clinicName: string) => {
    const clinic = sortedMalaysiaClinicDirectory.find((item) => item.name === clinicName);

    updateField('clinicianName', clinicName);

    if (!clinic) {
      return;
    }

    updateField('clinicianPhone', clinic.phone ?? '');
    updateField('clinicianAddress', clinic.address ?? '');
    updateField(
      'clinicianMapsUrl',
      clinic.mapsQuery
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.mapsQuery)}`
        : clinic.address
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`
          : '',
    );
  };

  const save = async () => {
    try {
      await saveMedicalId.mutateAsync(form);
      Alert.alert('Saved', 'Your medical ID was updated.');
      router.back();
    } catch (error) {
      Alert.alert('Unable to save medical ID', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <Screen>
      <BackHeader title="Medical ID" />
      <View style={styles.form}>
        <DropdownField
          label="Blood type"
          options={bloodTypeOptions}
          value={form.bloodType ?? ''}
          onChange={(value) => updateField('bloodType', value)}
        />
        <TokenInputField
          label="Allergies"
          hint="Search common allergies, then tap Save."
          placeholder="Search or add an allergy"
          suggestions={commonAllergies}
          value={form.allergies ?? ''}
          onChange={(value) => updateField('allergies', value)}
        />
        <FormField
          label="Conditions"
          multiline
          value={form.conditions}
          onChangeText={(value) => updateField('conditions', value)}
        />
        <FormField
          label="Current medications"
          multiline
          value={form.medications}
          onChangeText={(value) => updateField('medications', value)}
        />
        <SearchSelectField
          label="Clinician or clinic"
          options={clinicOptions}
          placeholder="Search hospitals and clinics in Malaysia"
          value={form.clinicianName ?? ''}
          onChange={applyClinicSelection}
        />
        <Text style={styles.helpText}>
          Choose a clinic to fill details automatically, or type over anything below if you want to customise it.
        </Text>
        <FormField
          label="Clinician name"
          value={form.clinicianName}
          onChangeText={(value) => updateField('clinicianName', value)}
        />
        <FormField
          keyboardType="phone-pad"
          label="Clinician phone"
          value={form.clinicianPhone}
          onChangeText={(value) => updateField('clinicianPhone', value)}
        />
        {form.clinicianPhone ? (
          <View style={styles.actionRow}>
            <PillButton
              label="Call clinic"
              onPress={() => Linking.openURL(`tel:${form.clinicianPhone}`).catch(() => undefined)}
              style={styles.actionButton}
              variant="secondary"
            />
          </View>
        ) : null}
        <FormField
          label="Clinic address"
          multiline
          value={form.clinicianAddress}
          onChangeText={(value) => updateField('clinicianAddress', value)}
        />
        {form.clinicianMapsUrl ? (
          <View style={styles.actionRow}>
            <PillButton
              label="Get directions"
              onPress={() => Linking.openURL(form.clinicianMapsUrl ?? '').catch(() => undefined)}
              style={styles.actionButton}
              variant="secondary"
            />
          </View>
        ) : null}
        <FormField
          label="Support notes"
          multiline
          value={form.notes}
          onChangeText={(value) => updateField('notes', value)}
        />
      </View>
      <PillButton label="Save Medical ID" loading={saveMedicalId.isPending} onPress={save} style={styles.saveButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  helpText: {
    color: colors.inkMuted,
    marginTop: -spacing.sm,
    ...typography.caption,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  saveButton: {
    marginTop: spacing.xxl,
  },
});
