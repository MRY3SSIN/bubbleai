import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/src/components/forms/FormField';
import { RiskBanner } from '@/src/components/feedback/RiskBanner';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { PillButton } from '@/src/components/PillButton';
import { useCreateJournalEntry } from '@/src/features/journal/use-journal';
import { detectRiskLevel } from '@/src/lib/risk';
import { colors, spacing, typography } from '@/src/theme';

export default function NewJournalEntryScreen() {
  const router = useRouter();
  const createEntry = useCreateJournalEntry();
  const [title, setTitle] = useState('New Mental Health Journal');
  const [text, setText] = useState('');

  const risk = detectRiskLevel(text);

  return (
    <Screen>
      <BackHeader title="Journal" />
      <Text style={styles.title}>Write what’s here</Text>
      <View style={styles.stack}>
        <FormField label="Entry title" value={title} onChangeText={setTitle} />
        <FormField
          hint="You can type freely. BubbleAI will summarize themes and watch for safety concerns."
          label="Journal entry"
          multiline
          value={text}
          onChangeText={setText}
        />
        {risk !== 'green' ? (
          <RiskBanner
            description="BubbleAI will shift into safer support and suggest human help if your writing shows elevated risk."
            level={risk}
            title={risk === 'red' ? 'Immediate safety concern' : 'Extra care mode'}
          />
        ) : null}
      </View>
      <PillButton
        label="Save journal"
        loading={createEntry.isPending}
        onPress={async () => {
          try {
            const entry = await createEntry.mutateAsync({ title, text });
            router.replace(`/journal/${entry.id}` as never);
          } catch (error) {
            Alert.alert('Unable to save journal', error instanceof Error ? error.message : 'Try again.');
          }
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
    marginBottom: spacing.xxxl,
  },
});

