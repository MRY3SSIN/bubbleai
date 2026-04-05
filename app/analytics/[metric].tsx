import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/AppCard';
import { GaugeChart } from '@/src/components/charts/GaugeChart';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { SegmentedControl } from '@/src/components/SegmentedControl';
import { Screen } from '@/src/components/layout/Screen';
import { useAnalyticsDetail } from '@/src/features/insights/use-insights';
import { colors, radii, spacing, typography } from '@/src/theme';

export default function AnalyticsDetailScreen() {
  const { metric = 'bubble_score' } = useLocalSearchParams<{ metric: string }>();
  const { data } = useAnalyticsDetail(metric);

  if (!data) {
    return null;
  }

  return (
    <Screen>
      <BackHeader title={data.title} />
      <AppCard accent style={styles.hero}>
        <SegmentedControl
          onChange={() => undefined}
          segments={[
            { label: 'W', value: 'week' },
            { label: 'M', value: 'month' },
            { label: '6M', value: '6_month' },
            { label: 'Y', value: 'year' },
          ]}
          value={data.period}
        />
        <GaugeChart centerLabel={data.value.replace(/[^0-9.]/g, '') || data.value} max={data.gaugeMax} value={data.gaugeValue} />
        <Text style={styles.heroValue}>{data.value}</Text>
        <Text style={styles.heroSubtitle}>{data.subtitle}</Text>
      </AppCard>
      <Text style={styles.sectionTitle}>BubbleAI Insight</Text>
      <AppCard>
        <Text style={styles.cardTitle}>{data.title}</Text>
        <Text style={styles.cardBody}>{data.insight}</Text>
        <View style={styles.bars}>
          {data.trend.map((point) => (
            <View key={point.label} style={styles.barWrap}>
              <View
                style={[
                  styles.bar,
                  {
                    height: 18 + point.value * 12,
                    backgroundColor: point.highlight ? colors.danger : colors.border,
                  },
                ]}
              />
              <Text style={styles.barLabel}>{point.label}</Text>
            </View>
          ))}
        </View>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroValue: {
    color: colors.ink,
    ...typography.h1,
  },
  heroSubtitle: {
    color: colors.inkMuted,
    ...typography.body,
  },
  sectionTitle: {
    color: colors.ink,
    marginBottom: spacing.md,
    ...typography.h1,
  },
  cardTitle: {
    color: colors.ink,
    ...typography.h3,
  },
  cardBody: {
    color: colors.inkMuted,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    ...typography.body,
  },
  bars: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  barWrap: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  bar: {
    borderRadius: radii.pill,
    width: '100%',
  },
  barLabel: {
    color: colors.inkMuted,
    ...typography.caption,
  },
});

