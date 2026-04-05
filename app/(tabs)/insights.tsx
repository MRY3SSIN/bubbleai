import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/AppCard';
import { GaugeChart } from '@/src/components/charts/GaugeChart';
import { SectionHeader } from '@/src/components/layout/SectionHeader';
import { Screen } from '@/src/components/layout/Screen';
import { useInsights } from '@/src/features/insights/use-insights';
import { useDashboard } from '@/src/features/dashboard/use-dashboard';
import { colors, spacing, typography } from '@/src/theme';

export default function InsightsScreen() {
  const router = useRouter();
  const { data: dashboard } = useDashboard();
  const { data: insights } = useInsights();

  if (!dashboard) {
    return null;
  }

  return (
    <Screen>
      <SectionHeader title="Insights and statistics" eyebrow="Bubble Score" />
      <Pressable onPress={() => router.push('/analytics/bubble_score')}>
        <AppCard accent>
          <Text style={styles.score}>{dashboard.bubbleScore.total}</Text>
          <Text style={styles.scoreBody}>{dashboard.bubbleScore.explanation}</Text>
        </AppCard>
      </Pressable>

      <View style={styles.metricStack}>
        {[
          { label: 'Sleep', value: '7', max: 10, route: 'sleep' },
          { label: 'Stress', value: '1', max: 5, route: 'stress' },
          { label: 'Mood', value: '4', max: 5, route: 'mood' },
        ].map((item) => (
          <Pressable key={item.route} onPress={() => router.push(`/analytics/${item.route}` as never)}>
            <AppCard style={styles.metricCard}>
              <GaugeChart centerLabel={item.value} max={item.max} size={180} value={Number(item.value)} />
              <Text style={styles.metricTitle}>{item.label}</Text>
            </AppCard>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Insight cards" />
      <View style={styles.metricStack}>
        {insights?.map((insight) => (
          <Pressable key={insight.id} onPress={() => router.push(`/analytics/${insight.metric === 'journal' ? 'bubble_score' : insight.metric}` as never)}>
            <AppCard>
              <Text style={styles.metricTitle}>{insight.title}</Text>
              <Text style={styles.scoreBody}>{insight.summary}</Text>
            </AppCard>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  score: {
    color: colors.mint,
    ...typography.display,
  },
  scoreBody: {
    color: colors.inkMuted,
    marginTop: spacing.sm,
    ...typography.body,
  },
  metricStack: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricCard: {
    alignItems: 'center',
  },
  metricTitle: {
    color: colors.ink,
    ...typography.h3,
  },
});

