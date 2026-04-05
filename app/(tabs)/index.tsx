import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/AppCard';
import { Avatar } from '@/src/components/Avatar';
import { BubbleLogo } from '@/src/components/brand/BubbleLogo';
import { BubbleComposer } from '@/src/components/chat/BubbleComposer';
import { OfflineBanner } from '@/src/components/feedback/OfflineBanner';
import { MetricTile } from '@/src/components/MetricTile';
import { SectionHeader } from '@/src/components/layout/SectionHeader';
import { Screen } from '@/src/components/layout/Screen';
import { useDashboard, useRecommendations } from '@/src/features/dashboard/use-dashboard';
import { env } from '@/src/lib/env';
import { useAppStore } from '@/src/lib/app-store';
import { colors, radii, spacing, typography } from '@/src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { data: dashboard } = useDashboard();
  const { data: recommendations } = useRecommendations();
  const profile = useAppStore((state) => state.profile);

  if (!dashboard || !profile) {
    return null;
  }

  return (
    <Screen>
      {env.isMock ? <OfflineBanner /> : null}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.date}>{dashboard.greetingDate}</Text>
          <Text style={styles.greeting}>Good Morning, {profile.displayName}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={() => router.push('/(tabs)/notifications')} style={styles.circle}>
            <Feather color={colors.ink} name="bell" size={18} />
          </Pressable>
          <Avatar name={profile.fullName} />
        </View>
      </View>

      <Pressable onPress={() => router.push('/chat/new')}>
        <AppCard accent style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>BubbleAI</Text>
          <Text style={styles.heroTitle}>Break the Bubble. How can I assist you?</Text>
          <View style={styles.heroLogo}>
            <BubbleLogo size={140} />
          </View>
          <BubbleComposer onSubmit={() => router.push('/chat/new')} onVoicePress={() => router.push('/chat/new')} />
        </AppCard>
      </Pressable>

      <View style={styles.quickGrid}>
        {dashboard.quickActions.map((action) => (
          <Pressable key={action.id} onPress={() => router.push(action.route as never)} style={styles.quickAction}>
            <AppCard style={styles.quickActionCard}>
              <View style={styles.quickIcon}>
                <Feather color={colors.ink} name={action.id.includes('journal') ? 'file-text' : 'heart'} size={18} />
              </View>
              <Text style={styles.quickTitle}>{action.title}</Text>
              <Text style={styles.quickSubtitle}>{action.subtitle}</Text>
            </AppCard>
          </Pressable>
        ))}
      </View>

      <SectionHeader eyebrow="Bubble Score" title={`${dashboard.bubbleScore.total}`} actionLabel="See details" onPressAction={() => router.push('/analytics/bubble_score')} />
      <View style={styles.metrics}>
        <MetricTile icon="🧠" subtitle={dashboard.stressSummary} title="Stress" value="Level 1" />
        <MetricTile icon="😄" subtitle={dashboard.moodSummary} title="Mood" value="Very Pleasant" />
        <MetricTile icon="🌙" subtitle={dashboard.sleepSummary} title="Sleep" value="6.9 hrs" />
      </View>

      <SectionHeader title="Recent insights" />
      <View style={styles.stack}>
        {dashboard.recentInsights.map((insight) => (
          <Pressable key={insight.id} onPress={() => router.push(`/analytics/${insight.metric === 'journal' ? 'bubble_score' : insight.metric}` as never)}>
            <AppCard>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightBody}>{insight.summary}</Text>
            </AppCard>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Small next steps" />
      <View style={styles.stack}>
        {recommendations?.map((recommendation) => (
          <AppCard key={recommendation.id}>
            <Text style={styles.insightTitle}>{recommendation.title}</Text>
            <Text style={styles.insightBody}>{recommendation.description}</Text>
          </AppCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  circle: {
    alignItems: 'center',
    backgroundColor: colors.cardStrong,
    borderRadius: radii.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  date: {
    color: colors.mint,
    ...typography.label,
  },
  greeting: {
    color: colors.ink,
    marginTop: 6,
    ...typography.h1,
  },
  heroCard: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
    minHeight: 360,
  },
  heroEyebrow: {
    color: colors.mint,
    ...typography.label,
  },
  heroTitle: {
    color: colors.ink,
    ...typography.h2,
  },
  heroLogo: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickAction: {
    flex: 1,
  },
  quickActionCard: {
    minHeight: 156,
  },
  quickIcon: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  quickTitle: {
    color: colors.ink,
    marginTop: spacing.xl,
    ...typography.h2,
    fontSize: 28,
  },
  quickSubtitle: {
    color: colors.inkMuted,
    marginTop: spacing.sm,
    ...typography.caption,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  stack: {
    gap: spacing.md,
  },
  insightTitle: {
    color: colors.ink,
    ...typography.h3,
  },
  insightBody: {
    color: colors.inkMuted,
    marginTop: spacing.sm,
    ...typography.body,
  },
});

