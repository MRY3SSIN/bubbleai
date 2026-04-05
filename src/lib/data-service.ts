import { startTransition } from 'react';

import { format, formatISO } from 'date-fns';

import { authService, supabase } from '@/src/lib/auth';
import { calculateBubbleScore } from '@/src/lib/bubble-score';
import { generateSessionTitle } from '@/src/lib/chat';
import {
  demoMessagesBySession,
  demoRecommendations,
  demoVoiceTranscript,
} from '@/src/lib/demo-data';
import { env } from '@/src/lib/env';
import { hasLiveSession, useAppStore } from '@/src/lib/app-store';
import { detectRiskLevel } from '@/src/lib/risk';
import type {
  AnalyticsDetail,
  ChatMessage,
  ChatSession,
  DailyCheckin,
  DashboardSnapshot,
  InsightCard,
  JournalEntry,
  NotificationItem,
  NotificationSettings,
  OnboardingFormValues,
  Recommendation,
  TrendPoint,
} from '@/src/types/domain';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value?: string | null) => Boolean(value && uuidPattern.test(value));

const getLiveUserId = () => {
  if (!hasLiveSession()) {
    return null;
  }

  const userId = useAppStore.getState().session?.id;
  return isUuid(userId) ? userId : null;
};

const getAccessToken = async () => {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

const invokeEdgeFunction = async <TResponse>(
  name: string,
  payload: Record<string, unknown>,
): Promise<TResponse> => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('Please sign in again before using this feature.');
  }

  const response = await fetch(`${env.supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: env.supabaseAnonKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data?.error === 'string' ? data.error : 'The server could not finish this request.',
    );
  }

  return data as TResponse;
};

const quickActions = [
  { id: 'qa-analysis', title: 'Take Self Analysis', subtitle: '2 mins', route: '/checkin/new' },
  { id: 'qa-journal', title: 'Take Journal', subtitle: 'Reflect gently', route: '/journal/new-entry' },
] as const;

const emptyBubbleScore = {
  total: 0,
  mood: 0,
  stress: 0,
  sleep: 0,
  consistency: 0,
  reflection: 0,
  explanation:
    'Your Bubble Score builds from mood, stress, sleep, and how consistently you check in or journal.',
};

const emptyDashboard = (): DashboardSnapshot => ({
  greetingDate: format(new Date(), 'EEEE, d MMMM'),
  bubbleScore: emptyBubbleScore,
  stressSummary: 'Take your first check-in to start tracking stress gently.',
  moodSummary: 'Mood patterns will appear once you start logging how you feel.',
  sleepSummary: 'Sleep trends will show up after a few check-ins.',
  quickActions: [...quickActions],
  recentInsights: [],
});

const moodLabel = (value?: number) => {
  switch (value) {
    case 1:
      return 'Very low';
    case 2:
      return 'Low';
    case 3:
      return 'Neutral';
    case 4:
      return 'Pretty good';
    case 5:
      return 'Very pleasant';
    default:
      return 'Unknown';
  }
};

const buildTrend = (
  values: number[],
  labels: string[],
): TrendPoint[] =>
  values.map((value, index) => ({
    label: labels[index] ?? `${index + 1}`,
    value,
    highlight: index === values.length - 1,
  }));

const mapCheckin = (row: {
  id: string;
  created_at: string;
  mood: number;
  stress: number;
  energy: number;
  sleep_hours: number;
  overwhelm: number;
  notes?: string | null;
}): DailyCheckin => ({
  id: row.id,
  createdAt: row.created_at,
  mood: row.mood as DailyCheckin['mood'],
  stress: row.stress,
  energy: row.energy,
  sleep: Number(row.sleep_hours),
  overwhelm: row.overwhelm,
  notes: row.notes ?? undefined,
});

const mapJournal = (row: {
  id: string;
  title: string;
  created_at: string;
  body?: string | null;
  voice_transcript?: string | null;
  summary?: string | null;
  themes?: unknown;
  risk_level: JournalEntry['riskLevel'];
}): JournalEntry => ({
  id: row.id,
  title: row.title,
  createdAt: row.created_at,
  text: row.body ?? '',
  transcript: row.voice_transcript ?? undefined,
  summary: row.summary ?? '',
  themes: Array.isArray(row.themes) ? (row.themes as string[]) : [],
  riskLevel: row.risk_level,
});

const getRecentCheckins = (checkins: DailyCheckin[], count = 7) =>
  [...checkins]
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    .slice(0, count);

const buildWeeklyTrend = (
  checkins: DailyCheckin[],
  selector: (checkin: DailyCheckin) => number,
): TrendPoint[] => {
  const recent = getRecentCheckins(checkins, 7).reverse();
  return buildTrend(
    recent.map(selector),
    recent.map((checkin) => format(new Date(checkin.createdAt), 'EEE')),
  );
};

const averageOf = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const buildInsightsFromData = (
  checkins: DailyCheckin[],
  journals: JournalEntry[],
): InsightCard[] => {
  if (!checkins.length && !journals.length) {
    return [];
  }

  const averageStress = averageOf(checkins.map((item) => item.stress));
  const averageSleep = averageOf(checkins.map((item) => item.sleep));
  const averageMood = averageOf(checkins.map((item) => item.mood));

  return [
    {
      id: 'stress-live',
      metric: 'stress' as const,
      title: 'Stress trend',
      summary:
        averageStress <= 3
          ? 'Your recent stress readings look steadier. Keep protecting the small routines that help you recover.'
          : 'Stress still looks elevated. Short pauses, hydration, and smaller next steps may help bring it down.',
      period: 'week' as const,
      chart: buildWeeklyTrend(checkins, (item) => item.stress),
      accentValue: averageStress ? averageStress.toFixed(1) : '0',
    },
    {
      id: 'sleep-live',
      metric: 'sleep' as const,
      title: 'Sleep rhythm',
      summary:
        averageSleep >= 7
          ? 'Your sleep is starting to look more regular, which usually supports mood and focus.'
          : 'Sleep still looks a bit uneven. A calmer evening routine could help your nights settle.',
      period: 'week' as const,
      chart: buildWeeklyTrend(checkins, (item) => item.sleep),
      accentValue: averageSleep ? `${averageSleep.toFixed(1)} hrs` : '0 hrs',
    },
    {
      id: 'journal-live',
      metric: 'journal' as const,
      title: 'Reflection consistency',
      summary:
        journals.length >= 3
          ? 'You have been reflecting consistently, which gives BubbleAI better context for support.'
          : 'A few more journal entries will help BubbleAI notice themes and spot helpful patterns.',
      period: 'week' as const,
      chart: buildTrend(
        [Math.min(journals.length, 7)],
        ['This week'],
      ),
      accentValue: `${journals.length} entries`,
    },
    {
      id: 'mood-live',
      metric: 'mood' as const,
      title: 'Mood pattern',
      summary:
        averageMood >= 4
          ? 'Mood has been leaning positive overall, with signs that your recent habits are helping.'
          : 'Mood has been mixed lately. More check-ins will help BubbleAI notice what affects it most.',
      period: 'week' as const,
      chart: buildWeeklyTrend(checkins, (item) => item.mood),
      accentValue: moodLabel(Math.round(averageMood)),
    },
  ].filter((item) => item.chart.length > 0);
};

const buildDashboardFromData = (
  checkins: DailyCheckin[],
  journals: JournalEntry[],
): DashboardSnapshot => {
  if (!checkins.length && !journals.length) {
    return emptyDashboard();
  }

  const latest = getRecentCheckins(checkins, 1)[0];
  const averageSleep = averageOf(checkins.map((item) => item.sleep));
  const bubbleScore = calculateBubbleScore(checkins, journals);

  return {
    greetingDate: format(new Date(), 'EEEE, d MMMM'),
    bubbleScore,
    stressSummary: latest
      ? `Latest stress check-in: ${latest.stress}/10. ${latest.stress <= 4 ? 'That looks manageable right now.' : 'There is some pressure showing up.'}`
      : 'Take your first check-in to start tracking stress gently.',
    moodSummary: latest
      ? `Latest mood: ${moodLabel(latest.mood)}. BubbleAI will get sharper as you log more moments.`
      : 'Mood patterns will appear once you start logging how you feel.',
    sleepSummary: averageSleep
      ? `Recent average sleep is ${averageSleep.toFixed(1)} hours.`
      : 'Sleep trends will show up after a few check-ins.',
    quickActions: [...quickActions],
    recentInsights: buildInsightsFromData(checkins, journals).slice(0, 3),
  };
};

const buildAnalyticsFromData = (
  metric: string,
  checkins: DailyCheckin[],
  journals: JournalEntry[],
  period: 'week' | 'month' | '6_month' | 'year' = 'week',
): AnalyticsDetail => {
  const bubbleScore = calculateBubbleScore(checkins, journals);
  const stressTrend = buildWeeklyTrend(checkins, (item) => item.stress);
  const moodTrend = buildWeeklyTrend(checkins, (item) => item.mood);
  const sleepTrend = buildWeeklyTrend(checkins, (item) => item.sleep);
  const averageStress = averageOf(checkins.map((item) => item.stress));
  const averageMood = averageOf(checkins.map((item) => item.mood));
  const averageSleep = averageOf(checkins.map((item) => item.sleep));
  const latest = getRecentCheckins(checkins, 1)[0];

  switch (metric) {
    case 'sleep':
      return {
        metric: 'sleep',
        title: 'Sleep',
        value: averageSleep ? `${averageSleep.toFixed(1)} hrs/day` : '0 hrs/day',
        subtitle: `Average sleep for ${period === 'week' ? 'this week' : period === 'month' ? 'this month' : period === '6_month' ? 'the last 6 months' : 'this year'}`,
        period,
        gaugeValue: averageSleep,
        gaugeMax: 10,
        trend: sleepTrend,
        insight: averageSleep >= 7
          ? 'Your sleep is landing in a steadier range. Keep your evenings simple and consistent.'
          : 'Sleep is still uneven. A gentler wind-down routine may help bring more consistency.',
      };
    case 'stress':
      return {
        metric: 'stress',
        title: 'Stress Level',
        value: latest ? `${latest.stress}` : '0',
        subtitle: `Most recent stress check-in for ${period === 'week' ? 'this week' : period === 'month' ? 'this month' : period === '6_month' ? 'the last 6 months' : 'this year'}`,
        period,
        gaugeValue: latest?.stress ?? 0,
        gaugeMax: 10,
        trend: stressTrend,
        insight: averageStress <= 4
          ? 'Recent stress looks lighter. Keep leaning on the routines that are helping.'
          : 'Stress is still showing up regularly. Smaller tasks and shorter recovery breaks may help.',
      };
    case 'mood':
      return {
        metric: 'mood',
        title: 'Mood Progress',
        value: moodLabel(Math.round(latest?.mood ?? averageMood) || 0),
        subtitle: `Most recent mood pattern for ${period === 'week' ? 'this week' : period === 'month' ? 'this month' : period === '6_month' ? 'the last 6 months' : 'this year'}`,
        period,
        gaugeValue: latest?.mood ?? averageMood,
        gaugeMax: 5,
        trend: moodTrend,
        insight: averageMood >= 4
          ? 'Mood has been leaning positive lately.'
          : 'Mood has been mixed, which means a few more check-ins will help reveal better patterns.',
      };
    default:
      return {
        metric: 'bubble_score',
        title: 'Bubble Score',
        value: `${bubbleScore.total}`,
        subtitle: 'Overall progress',
        period,
        gaugeValue: bubbleScore.total,
        gaugeMax: 300,
        trend: buildTrend(
          getRecentCheckins(checkins, 7)
            .reverse()
            .map((_, index, items) =>
              calculateBubbleScore(
                getRecentCheckins(checkins, items.length - index).reverse(),
                journals,
              ).total,
            ),
          getRecentCheckins(checkins, 7)
            .reverse()
            .map((item) => format(new Date(item.createdAt), 'EEE')),
        ),
        insight: bubbleScore.explanation,
      };
  }
};

const buildRecommendationsFromData = (
  checkins: DailyCheckin[],
  journals: JournalEntry[],
): Recommendation[] => {
  const latest = getRecentCheckins(checkins, 1)[0];

  if (!latest) {
    return [
      {
        id: 'rec-first-checkin',
        kind: 'journal',
        title: 'Start with a check-in',
        description: 'A quick check-in helps BubbleAI understand your stress, mood, and sleep more clearly.',
      },
    ];
  }

  const recommendations: Recommendation[] = [];

  if (latest.stress >= 6) {
    recommendations.push({
      id: 'rec-breathing',
      kind: 'breathing',
      title: 'Try one slow reset',
      description: 'Take 60 seconds for a slower breath and a small pause before the next task.',
    });
  }

  if (latest.sleep < 7) {
    recommendations.push({
      id: 'rec-sleep',
      kind: 'sleep',
      title: 'Protect your bedtime',
      description: 'Try a lighter evening routine tonight so your body gets a clearer signal to wind down.',
    });
  }

  if (journals.length < 2) {
    recommendations.push({
      id: 'rec-journal',
      kind: 'journal',
      title: 'Write one short note',
      description: 'One honest sentence about how today feels can be enough to spot patterns over time.',
    });
  }

  if (!recommendations.length) {
    recommendations.push(...demoRecommendations.slice(0, 2));
  }

  return recommendations.slice(0, 3);
};

const assistantReply = (message: string) => {
  const risk = detectRiskLevel(message);

  if (risk === 'red') {
    return {
      risk,
      text:
        'I’m concerned about your immediate safety. Please call emergency services, your trusted contact, or a crisis line right now. Stay with another person if you can.',
    };
  }

  if (risk === 'yellow') {
    return {
      risk,
      text:
        'I’m really glad you said that out loud. Before anything else, are you safe right now? Please reach out to a trusted person, your clinician, or a crisis line today.',
    };
  }

  return {
    risk,
    text:
      'That sounds like a lot to hold. For right now, try one sip of water, one slow breath, and one tiny next step. If it helps, tell me which part feels heaviest.',
  };
};

const fetchLiveWellnessData = async (userId: string) => {
  if (!supabase) {
    return { checkins: [], journals: [] };
  }

  const [{ data: checkinRows, error: checkinError }, { data: journalRows, error: journalError }] =
    await Promise.all([
      supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(14),
      supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(14),
    ]);

  if (checkinError) {
    throw checkinError;
  }

  if (journalError) {
    throw journalError;
  }

  return {
    checkins: (checkinRows ?? []).map(mapCheckin),
    journals: (journalRows ?? []).map(mapJournal),
  };
};

const limitForPeriod = (period: 'week' | 'month' | '6_month' | 'year') => {
  switch (period) {
    case 'month':
      return 30;
    case '6_month':
      return 180;
    case 'year':
      return 365;
    default:
      return 14;
  }
};

const fetchLiveWellnessDataForPeriod = async (
  userId: string,
  period: 'week' | 'month' | '6_month' | 'year',
) => {
  if (!supabase) {
    return { checkins: [], journals: [] };
  }

  const limit = limitForPeriod(period);
  const [{ data: checkinRows, error: checkinError }, { data: journalRows, error: journalError }] =
    await Promise.all([
      supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

  if (checkinError) {
    throw checkinError;
  }

  if (journalError) {
    throw journalError;
  }

  return {
    checkins: (checkinRows ?? []).map(mapCheckin),
    journals: (journalRows ?? []).map(mapJournal),
  };
};

export const dataService = {
  auth: authService,

  async getDashboard(): Promise<DashboardSnapshot> {
    if (env.isMock) {
      const state = useAppStore.getState();
      return buildDashboardFromData(state.checkins, state.journalEntries);
    }

    const userId = getLiveUserId();
    if (!userId) {
      return emptyDashboard();
    }

    const { checkins, journals } = await fetchLiveWellnessData(userId);
    return buildDashboardFromData(checkins, journals);
  },

  async listInsights(): Promise<InsightCard[]> {
    if (env.isMock) {
      const state = useAppStore.getState();
      return buildInsightsFromData(state.checkins, state.journalEntries);
    }

    const userId = getLiveUserId();
    if (!userId) {
      return [];
    }

    const { checkins, journals } = await fetchLiveWellnessData(userId);
    return buildInsightsFromData(checkins, journals);
  },

  async getAnalytics(
    metric: string,
    period: 'week' | 'month' | '6_month' | 'year' = 'week',
  ): Promise<AnalyticsDetail> {
    if (env.isMock) {
      const state = useAppStore.getState();
      return buildAnalyticsFromData(metric, state.checkins, state.journalEntries, period);
    }

    const userId = getLiveUserId();
    if (!userId) {
      return buildAnalyticsFromData(metric, [], [], period);
    }

    const { checkins, journals } = await fetchLiveWellnessDataForPeriod(userId, period);
    return buildAnalyticsFromData(metric, checkins, journals, period);
  },

  async listNotifications(): Promise<NotificationItem[]> {
    if (env.isMock) {
      return useAppStore.getState().notifications;
    }

    return [];
  },

  async updateNotificationSettings(settings: Partial<NotificationSettings>) {
    if (!env.isMock && supabase) {
      const userId = getLiveUserId();
      if (!userId) {
        throw new Error('Please sign in again to update notification settings.');
      }

      const { data, error } = await supabase
        .from('notification_settings')
        .upsert(
          {
            user_id: userId,
            enabled: settings.enabled,
            daily_checkin: settings.dailyCheckin,
            journaling: settings.journaling,
            bedtime: settings.bedtime,
            hydration: settings.hydration,
            movement: settings.movement,
            quiet_hours_start: settings.quietHoursStart,
            quiet_hours_end: settings.quietHoursEnd,
          },
          { onConflict: 'user_id' },
        )
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      const normalized = {
        enabled: data.enabled,
        dailyCheckin: data.daily_checkin,
        journaling: data.journaling,
        bedtime: data.bedtime,
        hydration: data.hydration,
        movement: data.movement,
        quietHoursStart: data.quiet_hours_start,
        quietHoursEnd: data.quiet_hours_end,
      };

      useAppStore.getState().updateNotificationSettings(normalized);
      return normalized;
    }

    useAppStore.getState().updateNotificationSettings(settings);
    return useAppStore.getState().notificationSettings;
  },

  async getNotificationSettings() {
    if (!env.isMock && supabase) {
      const userId = getLiveUserId();
      if (userId) {
        const { data } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (data) {
          const normalized = {
            enabled: data.enabled,
            dailyCheckin: data.daily_checkin,
            journaling: data.journaling,
            bedtime: data.bedtime,
            hydration: data.hydration,
            movement: data.movement,
            quietHoursStart: data.quiet_hours_start,
            quietHoursEnd: data.quiet_hours_end,
          };
          useAppStore.getState().updateNotificationSettings(normalized);
          return normalized;
        }
      }
    }

    return useAppStore.getState().notificationSettings;
  },

  async listJournalEntries() {
    if (!env.isMock && supabase) {
      const userId = getLiveUserId();
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapJournal);
    }

    return useAppStore.getState().journalEntries;
  },

  async getJournalEntry(entryId: string) {
    if (!env.isMock && supabase && isUuid(entryId)) {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? mapJournal(data) : null;
    }

    if (!env.isMock) {
      return null;
    }

    return useAppStore.getState().journalEntries.find((entry) => entry.id === entryId) ?? null;
  },

  async createJournalEntry(payload: Pick<JournalEntry, 'title' | 'text' | 'summary' | 'themes' | 'riskLevel'>) {
    const entry: JournalEntry = {
      id: `journal-${Date.now()}`,
      createdAt: formatISO(new Date()),
      ...payload,
    };

    if (!env.isMock && supabase) {
      const userId = getLiveUserId();
      if (!userId) {
        throw new Error('Please sign in again before creating a journal entry.');
      }

      const [moderationResult, riskResult] = await Promise.allSettled([
        invokeEdgeFunction<Record<string, unknown>>('moderate-message', {
          input: payload.text,
        }),
        invokeEdgeFunction<{ risk_level?: JournalEntry['riskLevel']; confidence?: number; rationale?: string }>(
          'classify-risk',
          { content: payload.text },
        ),
      ]);

      const moderationData =
        moderationResult.status === 'fulfilled' ? moderationResult.value : null;
      const riskData = riskResult.status === 'fulfilled' ? riskResult.value : null;

      const resolvedRisk =
        !riskData?.risk_level ? detectRiskLevel(payload.text) : riskData.risk_level;

      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: userId,
          title: payload.title,
          body: payload.text,
          summary: payload.summary,
          themes: payload.themes,
          risk_level: resolvedRisk,
          analysis_status: 'complete',
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      if (resolvedRisk !== 'green') {
        await supabase.from('safety_events').insert({
          user_id: userId,
          source: 'journal_entry',
          source_id: data.id,
          moderation_result: moderationData ?? {},
          classifier_result: riskData ?? {},
          risk_level: resolvedRisk,
          escalation_path: resolvedRisk === 'red' ? 'crisis_sheet' : 'support_resources',
        });
      }

      return mapJournal(data);
    }

    useAppStore.getState().addJournalEntry(entry);
    return entry;
  },

  async saveCheckin(payload: Omit<DailyCheckin, 'id' | 'createdAt'>) {
    const checkin: DailyCheckin = {
      id: `checkin-${Date.now()}`,
      createdAt: formatISO(new Date()),
      ...payload,
    };

    if (!env.isMock && supabase) {
      const userId = getLiveUserId();
      if (!userId) {
        throw new Error('Please sign in again before saving a check-in.');
      }

      const { data, error } = await supabase
        .from('daily_checkins')
        .insert({
          user_id: userId,
          mood: payload.mood,
          stress: payload.stress,
          energy: payload.energy,
          sleep_hours: payload.sleep,
          overwhelm: payload.overwhelm,
          notes: payload.notes,
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      await Promise.all([
        supabase.from('mood_logs').insert({ user_id: userId, value: payload.mood }),
        supabase.from('stress_logs').insert({ user_id: userId, value: payload.stress }),
        supabase.from('sleep_logs').insert({ user_id: userId, hours: payload.sleep }),
        supabase.from('assessments').insert({
          user_id: userId,
          payload,
        }),
      ]);

      return mapCheckin(data);
    }

    useAppStore.getState().addCheckin(checkin);
    return checkin;
  },

  async listChatSessions() {
    if (!env.isMock && supabase) {
      const userId = getLiveUserId();
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []).map((session) => ({
        id: session.id,
        title: session.title,
        mode: session.mode,
        lastMessageAt: session.last_message_at,
        preview: 'Open conversation',
        riskState: session.risk_state,
      }));
    }

    return useAppStore.getState().chatSessions;
  },

  async getChatMessages(sessionId: string) {
    if (!env.isMock && supabase) {
      if (!isUuid(sessionId)) {
        return [];
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.created_at,
        riskLevel: message.risk_level,
      }));
    }

    return useAppStore.getState().chatMessages[sessionId] ?? demoMessagesBySession[sessionId] ?? [];
  },

  async createChatSession(mode: 'text' | 'voice', title = 'New chat') {
    const generatedTitle = generateSessionTitle(title);

    if (!env.isMock && supabase) {
      const userId = getLiveUserId();
      if (!userId) {
        throw new Error('Please sign in again before starting a new chat.');
      }

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          title: generatedTitle,
          mode,
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        title: data.title,
        mode: data.mode,
        lastMessageAt: data.last_message_at,
        preview: 'Start chatting with BubbleAI',
        riskState: data.risk_state,
      } satisfies ChatSession;
    }

    const session: ChatSession = {
      id: `chat-${Date.now()}`,
      title: generatedTitle,
      mode,
      lastMessageAt: formatISO(new Date()),
      preview: 'Start chatting with BubbleAI',
      riskState: 'green',
    };
    useAppStore.getState().addChatSession(session);
    return session;
  },

  async sendChatMessage(sessionId: string, content: string) {
    const state = useAppStore.getState();
    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: formatISO(new Date()),
    };
    state.addChatMessage(sessionId, userMessage);

    if (!env.isMock && supabase) {
      if (!isUuid(sessionId) || !getLiveUserId()) {
        throw new Error('Please sign in again before continuing the conversation.');
      }

      const data = await invokeEdgeFunction<{ assistant_text: string; risk_level: ChatMessage['riskLevel'] }>(
        'text-chat-response',
        {
          sessionId,
          message: content,
          mode: 'text',
        },
      );

      if (!data?.assistant_text) {
        throw new Error('BubbleAI could not answer right now. Please try again.');
      }

      const assistantMessage: ChatMessage = {
        id: `msg-assistant-${Date.now()}`,
        role: 'assistant',
        content: data.assistant_text,
        riskLevel: data.risk_level,
        createdAt: formatISO(new Date()),
      };

      startTransition(() => {
        useAppStore.getState().addChatMessage(sessionId, assistantMessage);
      });

      return assistantMessage;
    }

    await delay(500);

    const reply = assistantReply(content);
    const assistantMessage: ChatMessage = {
      id: `msg-assistant-${Date.now()}`,
      role: 'assistant',
      content: reply.text,
      riskLevel: reply.risk,
      createdAt: formatISO(new Date()),
    };

    startTransition(() => {
      useAppStore.getState().addChatMessage(sessionId, assistantMessage);
    });

    return assistantMessage;
  },

  async listRecommendations(): Promise<Recommendation[]> {
    if (env.isMock) {
      return demoRecommendations;
    }

    const userId = getLiveUserId();
    if (!userId) {
      return [];
    }

    const { checkins, journals } = await fetchLiveWellnessData(userId);
    return buildRecommendationsFromData(checkins, journals);
  },

  async getVoiceTranscriptPreview() {
    if (env.isMock) {
      return demoVoiceTranscript;
    }

    return [
      'Tap the mic to start a calmer voice check-in.',
      'BubbleAI will listen and respond once the live voice flow is connected.',
    ];
  },

  async completeOnboarding(values: OnboardingFormValues) {
    if (!env.isMock && supabase) {
      const session = useAppStore.getState().session;
      if (!session || !isUuid(session.id)) {
        throw new Error('Please sign in again before finishing onboarding.');
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: session.id,
        email: session.email,
        full_name: values.fullName,
        display_name: values.displayName,
        pronouns: values.pronouns,
        birth_year: values.birthYear,
        gender_identity: values.genderIdentity,
        preferred_voice: values.preferredVoice,
        menstrual_support_enabled: values.menstrualSupportEnabled,
        onboarding_complete: true,
        privacy_accepted_at: new Date().toISOString(),
        ai_disclaimer_accepted_at: new Date().toISOString(),
        crisis_disclaimer_accepted_at: new Date().toISOString(),
      });

      if (profileError) {
        throw profileError;
      }

      await Promise.all([
        supabase.from('preferences').upsert({
          user_id: session.id,
          smoking_habits: values.smokingHabits,
          drinking_habits: values.drinkingHabits,
          medications_text: values.medicationsText,
          symptoms_text: values.symptomsText,
          notification_opt_in: values.notificationsEnabled,
        }),
        supabase.from('notification_settings').upsert({
          user_id: session.id,
          enabled: values.notificationsEnabled,
        }),
        supabase.auth.updateUser({
          data: {
            full_name: values.fullName,
            display_name: values.displayName,
            onboarding_complete: true,
          },
        }),
      ]);
    }

    useAppStore.getState().completeOnboarding(values);
    return useAppStore.getState().profile;
  },
};
