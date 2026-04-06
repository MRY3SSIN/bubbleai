import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AppCard } from '@/src/components/AppCard';
import { GaugeChart } from '@/src/components/charts/GaugeChart';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { SegmentedControl } from '@/src/components/SegmentedControl';
import { Screen } from '@/src/components/layout/Screen';
import { useAnalyticsDetail } from '@/src/features/insights/use-insights';
import { colors, radii, spacing, typography } from '@/src/theme';

export default function AnalyticsDetailScreen() {
  const { metric = 'bubble_score' } = useLocalSearchParams<{ metric: string }>();
  const { width } = useWindowDimensions();
  const [period, setPeriod] = useState<'week' | 'month' | '6_month' | 'year'>('week');
  const { data } = useAnalyticsDetail(metric, period);

  if (!data) {
    return null;
  }

  const isCompact = width < 390;
  const maxTrendValue = Math.max(...data.trend.map((point) => point.value), 1);
  const chartCeiling = Math.max(data.gaugeMax, maxTrendValue * 1.35, 1);
  const trendCount = Math.max(data.trend.length, 1);
  const barWidth = Math.min(isCompact ? 34 : 42, Math.max(22, (width - 112) / trendCount));
  const gaugeLabel =
    data.metric === 'mood'
      ? `${Math.max(0, Math.round(data.gaugeValue || 0))}/5`
      : data.value.replace(/[^0-9.]/g, '') || data.value;
  const highlightColor =
    data.metric === 'stress' ? colors.danger : data.metric === 'sleep' ? colors.accent : colors.mint;

  return (
    <Screen>
      <BackHeader title={data.title} />
      <AppCard accent style={styles.hero}>
        <SegmentedControl
          onChange={setPeriod}
          segments={[
            { label: 'W', value: 'week' },
            { label: 'M', value: 'month' },
            { label: '6M', value: '6_month' },
            { label: 'Y', value: 'year' },
          ]}
          value={period}
        />
        <GaugeChart
          centerLabel={gaugeLabel}
          max={data.gaugeMax}
          size={isCompact ? 220 : 260}
          value={data.gaugeValue}
        />
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          numberOfLines={2}
          style={[styles.heroValue, data.metric === 'mood' && styles.heroValueLong]}
        >
          {data.value}
        </Text>
        <Text style={styles.heroSubtitle}>{data.subtitle}</Text>
      </AppCard>
      <Text style={styles.sectionTitle}>BubbleAI Insight</Text>
      <AppCard>
        <Text style={styles.cardTitle}>{data.title}</Text>
        <Text style={styles.cardBody}>{data.insight}</Text>
        <View style={[styles.bars, isCompact && styles.barsCompact]}>
          {data.trend.map((point) => (
            <View key={point.label} style={[styles.barWrap, { width: barWidth }]}>
              <View
                style={[
                  styles.bar,
                  {
                    height:
                      point.value <= 0
                        ? 10
                        : 18 + (point.value / chartCeiling) * (isCompact ? 88 : 104),
                    backgroundColor: point.highlight ? highlightColor : colors.border,
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
    textAlign: 'center',
    ...typography.h1,
  },
  heroValueLong: {
    fontSize: 24,
    lineHeight: 30,
    marginTop: spacing.sm,
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
    justifyContent: 'space-between',
  },
  barsCompact: {
    gap: spacing.xs,
  },
  barWrap: {
    alignItems: 'center',
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
