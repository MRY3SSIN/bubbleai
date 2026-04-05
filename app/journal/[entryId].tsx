import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GaugeChart } from '@/src/components/charts/GaugeChart';
import { RiskBanner } from '@/src/components/feedback/RiskBanner';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { SectionHeader } from '@/src/components/layout/SectionHeader';
import { Screen } from '@/src/components/layout/Screen';
import { useJournalEntry } from '@/src/features/journal/use-journal';
import { colors, radii, spacing, typography } from '@/src/theme';

export default function JournalEntryScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { data: entry } = useJournalEntry(entryId);

  if (!entry) {
    return null;
  }

  return (
    <Screen>
      <BackHeader title="Journal" />
      <Text style={styles.title}>{entry.title}</Text>
      <Text style={styles.date}>{new Date(entry.createdAt).toDateString()}</Text>
      {entry.riskLevel !== 'green' ? (
        <RiskBanner
          description="This journal reflects higher distress. BubbleAI should keep support practical, direct, and close to human help."
          level={entry.riskLevel}
          title={entry.riskLevel === 'red' ? 'Warning: Immediate help needed' : 'Warning: Elevated concern'}
        />
      ) : null}
      <Text style={styles.summary}>{entry.summary}</Text>
      <Text style={styles.body}>{entry.text}</Text>
      <SectionHeader title="BubbleAI Insight" />
      <View style={styles.stack}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stress level</Text>
          <GaugeChart centerLabel={entry.riskLevel === 'green' ? '2' : entry.riskLevel === 'yellow' ? '4' : '5'} max={5} value={entry.riskLevel === 'green' ? 2 : entry.riskLevel === 'yellow' ? 4 : 5} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    ...typography.h1,
  },
  date: {
    color: colors.inkMuted,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
    ...typography.caption,
  },
  summary: {
    color: colors.mint,
    marginBottom: spacing.lg,
    ...typography.h3,
  },
  body: {
    color: colors.inkMuted,
    marginTop: spacing.lg,
    ...typography.body,
  },
  stack: {
    gap: spacing.md,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.cardStrong,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  cardTitle: {
    alignSelf: 'flex-start',
    color: colors.ink,
    ...typography.h3,
  },
});
