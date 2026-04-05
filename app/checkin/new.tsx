import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { FeelingSlider } from '@/src/components/forms/FeelingSlider';
import { FormField } from '@/src/components/forms/FormField';
import { WheelNumberPicker } from '@/src/components/forms/WheelNumberPicker';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { dataService } from '@/src/lib/data-service';
import { colors, spacing, typography } from '@/src/theme';

export default function NewCheckinScreen() {
  const router = useRouter();
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [stress, setStress] = useState(4);
  const [energy, setEnergy] = useState(6);
  const [sleep, setSleep] = useState(7);
  const [overwhelm, setOverwhelm] = useState(4);
  const [notes, setNotes] = useState('');

  return (
    <Screen>
      <BackHeader title="Self analysis" />
      <Text style={styles.title}>How are you feeling today?</Text>
      <FeelingSlider value={mood} onChange={setMood} />
      <View style={styles.stack}>
        <WheelNumberPicker label="Stress level" min={1} max={10} onChange={setStress} value={stress} />
        <WheelNumberPicker label="Energy" min={1} max={10} onChange={setEnergy} value={energy} />
        <WheelNumberPicker label="Sleep hours" min={0} max={12} onChange={setSleep} value={sleep} />
        <WheelNumberPicker label="Overwhelm" min={1} max={10} onChange={setOverwhelm} value={overwhelm} />
        <FormField label="Notes, if you want" multiline value={notes} onChangeText={setNotes} />
      </View>
      <PillButton
        label="Save assessment"
        onPress={async () => {
          await dataService.saveCheckin({ mood, stress, energy, sleep, overwhelm, notes });
          Alert.alert('Saved', 'Your self analysis was added to BubbleAI.');
          router.back();
        }}
      />
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
    marginTop: spacing.xl,
  },
});

