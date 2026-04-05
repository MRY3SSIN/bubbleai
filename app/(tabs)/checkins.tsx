import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AppCard } from '@/src/components/AppCard';
import { SegmentedControl } from '@/src/components/SegmentedControl';
import { SectionHeader } from '@/src/components/layout/SectionHeader';
import { Screen } from '@/src/components/layout/Screen';
import { useJournalEntries } from '@/src/features/journal/use-journal';
import { useAppStore } from '@/src/lib/app-store';
import { colors, spacing, typography } from '@/src/theme';

export default function CheckinsHubScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [segment, setSegment] = useState<'analysis' | 'journals'>('analysis');
  const { data: journalEntries } = useJournalEntries();
  const checkins = useAppStore((state) => state.checkins);
  const isCompact = width < 390;

  return (
    <Screen>
      <SectionHeader eyebrow={format(new Date(), 'EEEE, d MMMM')} title="Self Assessment" />
      <View style={[styles.quickGrid, isCompact && styles.quickGridCompact]}>
        <Pressable onPress={() => router.push('/checkin/new')} style={styles.gridItem}>
          <AppCard style={[styles.quickCard, isCompact && styles.quickCardCompact]}>
            <Text style={styles.icon}>♡</Text>
            <Text style={[styles.quickTitle, isCompact && styles.quickTitleCompact]}>Take Self Analysis</Text>
          </AppCard>
        </Pressable>
        <Pressable onPress={() => router.push('/journal/new-entry')} style={styles.gridItem}>
          <AppCard style={[styles.quickCard, isCompact && styles.quickCardCompact]}>
            <Text style={styles.icon}>📝</Text>
            <Text style={[styles.quickTitle, isCompact && styles.quickTitleCompact]}>Take Journal</Text>
          </AppCard>
        </Pressable>
      </View>

      <SectionHeader title="Previous Analysis" />
      <SegmentedControl
        onChange={setSegment}
        segments={[
          { label: 'Analysis', value: 'analysis' },
          { label: 'Journals', value: 'journals' },
        ]}
        value={segment}
      />

      <View style={styles.stack}>
        {segment === 'analysis'
          ? checkins.map((checkin) => (
              <AppCard key={checkin.id}>
                <Text style={styles.listTitle}>{new Date(checkin.createdAt).toDateString()}</Text>
                <Text style={styles.listBody}>
                  Mood {checkin.mood}/5, stress {checkin.stress}/10, sleep {checkin.sleep}h
                </Text>
              </AppCard>
            ))
          : journalEntries?.map((entry) => (
              <Pressable key={entry.id} onPress={() => router.push(`/journal/${entry.id}` as never)}>
                <AppCard>
                  <Text style={styles.listTitle}>{entry.title}</Text>
                  <Text style={styles.listBody}>{entry.summary}</Text>
                </AppCard>
              </Pressable>
            ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickGridCompact: {
    flexDirection: 'column',
  },
  gridItem: {
    flex: 1,
  },
  quickCard: {
    minHeight: 150,
  },
  quickCardCompact: {
    minHeight: 118,
  },
  icon: {
    fontSize: 24,
  },
  quickTitle: {
    color: colors.ink,
    marginTop: spacing.lg,
    ...typography.h2,
    fontSize: 24,
    lineHeight: 28,
  },
  quickTitleCompact: {
    fontSize: 20,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  stack: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  listTitle: {
    color: colors.ink,
    ...typography.h3,
  },
  listBody: {
    color: colors.inkMuted,
    marginTop: spacing.sm,
    ...typography.body,
  },
});
