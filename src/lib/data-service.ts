import { startTransition } from 'react';

import { format, formatISO } from 'date-fns';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { getCalendars, getLocales } from 'expo-localization';
import * as Sharing from 'expo-sharing';

import { authService, supabase } from '@/src/lib/auth';
import { avatarSignedUrlTtlSeconds, parseStoredAvatarValue } from '@/src/lib/avatar-storage';
import { calculateBubbleScore } from '@/src/lib/bubble-score';
import { generateSessionTitle } from '@/src/lib/chat';
import { getCycleInsight } from '@/src/lib/cycle-support';
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
  ContactRecord,
  DailyCheckin,
  DashboardSnapshot,
  InsightCard,
  JournalEntry,
  CycleProfile,
  MedicalId,
  NotificationItem,
  NotificationSettings,
  OnboardingFormValues,
  PrivacySettings,
  Profile,
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

const parseJsonSafely = (rawText: string) => {
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getDeviceContext = () => {
  const locale = getLocales()[0];
  const calendar = getCalendars()[0];

  return {
    locale: locale?.languageTag ?? 'en-MY',
    region: locale?.regionCode ?? 'MY',
    timezone: calendar?.timeZone ?? 'Asia/Kuala_Lumpur',
  };
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

  const rawText = await response.text();
  const data = parseJsonSafely(rawText);

  if (!response.ok) {
    throw new Error(
      typeof data?.error === 'string'
        ? data.error
        : rawText || 'The server could not finish this request.',
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

const inferMimeType = (uri: string) => {
  const extension = uri.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    default:
      return 'image/jpeg';
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

const mapContact = (row: {
  id: string;
  name: string;
  relationship?: string | null;
  phone?: string | null;
  email?: string | null;
  is_favorite?: boolean | null;
  notes?: string | null;
}): ContactRecord => ({
  id: row.id,
  name: row.name,
  relationship: row.relationship ?? 'Trusted person',
  phone: row.phone ?? undefined,
  email: row.email ?? undefined,
  isFavorite: Boolean(row.is_favorite),
  notes: row.notes ?? undefined,
});

const defaultPrivacySettings: PrivacySettings = {
  privateMode: false,
  hideNotificationPreviews: true,
};

const defaultCycleProfile: CycleProfile = {
  enabled: false,
  cycleLengthDays: 28,
  periodLengthDays: 5,
  irregularCycles: false,
  symptoms: [],
};

const mapProfileWithPreferences = async (
  profileRow: Record<string, unknown>,
  preferenceRow?: Record<string, unknown> | null,
): Promise<Profile> => {
  const storedAvatar = parseStoredAvatarValue((profileRow.avatar_url as string | null) ?? undefined);
  const avatarUrl =
    storedAvatar.avatarPath && supabase
      ? (
          await supabase.storage
            .from('avatars')
            .createSignedUrl(storedAvatar.avatarPath, avatarSignedUrlTtlSeconds)
        ).data?.signedUrl ?? storedAvatar.directUrl
      : storedAvatar.directUrl;

  return {
    id: String(profileRow.id),
    email: String(profileRow.email ?? ''),
    fullName: String(profileRow.full_name ?? 'BubbleAI User'),
    displayName: String(profileRow.display_name ?? 'Friend'),
    pronouns: (profileRow.pronouns as string | null) ?? undefined,
    birthYear: (profileRow.birth_year as number | null) ?? undefined,
    genderIdentity: (profileRow.gender_identity as string | null) ?? undefined,
    preferredVoice: (profileRow.preferred_voice as Profile['preferredVoice']) ?? 'neutral_calm',
    avatarPath: storedAvatar.avatarPath,
    avatarUrl,
    avatarTheme: (profileRow.avatar_theme as Profile['avatarTheme']) ?? 'mint',
    medications:
      typeof preferenceRow?.medications_text === 'string'
        ? preferenceRow.medications_text
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
    diagnoses:
      typeof preferenceRow?.symptoms_text === 'string'
        ? preferenceRow.symptoms_text
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
    smokingHabits: (preferenceRow?.smoking_habits as string | null) ?? undefined,
    drinkingHabits: (preferenceRow?.drinking_habits as string | null) ?? undefined,
    menstrualSupportEnabled: Boolean(profileRow.menstrual_support_enabled),
    privacyAcceptedAt: (profileRow.privacy_accepted_at as string | null) ?? undefined,
    aiDisclaimerAcceptedAt: (profileRow.ai_disclaimer_accepted_at as string | null) ?? undefined,
    crisisDisclaimerAcceptedAt: (profileRow.crisis_disclaimer_accepted_at as string | null) ?? undefined,
    onboardingComplete: Boolean(profileRow.onboarding_complete),
  };
};

const mapCycleProfile = (row: Record<string, unknown> | null | undefined): CycleProfile | null => {
  if (!row) {
    return null;
  }

  return {
    enabled: Boolean(row.enabled),
    lastPeriodStart: (row.last_period_start as string | null) ?? undefined,
    cycleLengthDays: Number(row.cycle_length_days ?? 28),
    periodLengthDays: Number(row.period_length_days ?? 5),
    irregularCycles: Boolean(row.irregular_cycles),
    symptoms:
      typeof row.symptoms_text === 'string'
        ? row.symptoms_text
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
    notes: (row.notes as string | null) ?? undefined,
  };
};

const mapPrivacySettings = (row: Record<string, unknown> | null | undefined): PrivacySettings =>
  row
    ? {
        privateMode: Boolean(row.private_mode),
        hideNotificationPreviews: Boolean(row.hide_notification_previews),
      }
    : defaultPrivacySettings;

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
  cycleProfile?: CycleProfile | null,
): Recommendation[] => {
  const latest = getRecentCheckins(checkins, 1)[0];
  const cycleInsight = getCycleInsight(cycleProfile);

  if (!latest) {
    return [
      ...(cycleInsight ? [cycleInsight.recommendation] : []),
      {
        id: 'rec-first-checkin',
        kind: 'journal',
        title: 'Start with a check-in',
        description: 'A quick check-in helps BubbleAI understand your stress, mood, and sleep more clearly.',
      },
    ];
  }

  const recommendations: Recommendation[] = [];

  if (cycleInsight) {
    recommendations.push(cycleInsight.recommendation);
  }

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

  async getProfile(): Promise<Profile | null> {
    if (env.isMock) {
      return useAppStore.getState().profile;
    }

    if (!supabase) {
      return null;
    }

    const userId = getLiveUserId();
    if (!userId) {
      return null;
    }

    const [{ data: profileRow, error: profileError }, { data: preferenceRow, error: preferenceError }] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('preferences').select('*').eq('user_id', userId).maybeSingle(),
      ]);

    if (profileError) {
      throw profileError;
    }

    if (preferenceError) {
      throw preferenceError;
    }

    if (!profileRow) {
      return null;
    }

    const profile = await mapProfileWithPreferences(profileRow, preferenceRow);
    const session = useAppStore.getState().session;
    if (session) {
      useAppStore.getState().hydrateLiveSession(
        {
          ...session,
          fullName: profile.fullName,
          displayName: profile.displayName,
          avatarPath: profile.avatarPath,
          avatarUrl: profile.avatarUrl,
          avatarTheme: profile.avatarTheme,
          onboardingComplete: profile.onboardingComplete,
        },
        profile,
      );
    }
    return profile;
  },

  async updateProfile(input: {
    fullName: string;
    displayName: string;
    pronouns?: string;
    birthYear?: number;
    genderIdentity?: string;
    preferredVoice: Profile['preferredVoice'];
    avatarPath?: string;
    avatarTheme?: Profile['avatarTheme'];
    avatarUrl?: string;
    smokingHabits?: string;
    drinkingHabits?: string;
    medicationsText?: string;
    symptomsText?: string;
  }) {
    if (env.isMock) {
      const profile = useAppStore.getState().profile;
      if (!profile) {
        return null;
      }

      const nextProfile: Profile = {
        ...profile,
        fullName: input.fullName,
        displayName: input.displayName,
        pronouns: input.pronouns,
        birthYear: input.birthYear,
        genderIdentity: input.genderIdentity,
        preferredVoice: input.preferredVoice,
        avatarPath: input.avatarPath ?? profile.avatarPath,
        avatarTheme: input.avatarTheme ?? profile.avatarTheme ?? 'mint',
        avatarUrl: input.avatarUrl ?? profile.avatarUrl,
        smokingHabits: input.smokingHabits,
        drinkingHabits: input.drinkingHabits,
        medications:
          input.medicationsText
            ?.split(',')
            .map((value) => value.trim())
            .filter(Boolean) ?? [],
        diagnoses:
          input.symptomsText
            ?.split(',')
            .map((value) => value.trim())
            .filter(Boolean) ?? [],
      };
      useAppStore.getState().hydrateLiveSession(
        {
          ...(useAppStore.getState().session ?? {
            id: profile.id,
            email: profile.email,
            fullName: nextProfile.fullName,
            displayName: nextProfile.displayName,
            onboardingComplete: profile.onboardingComplete,
          }),
          fullName: nextProfile.fullName,
          displayName: nextProfile.displayName,
          avatarPath: nextProfile.avatarPath,
          avatarTheme: nextProfile.avatarTheme,
          avatarUrl: nextProfile.avatarUrl,
        },
        nextProfile,
      );
      return nextProfile;
    }

    if (!supabase) {
      return null;
    }

    const userId = getLiveUserId();
    if (!userId) {
      throw new Error('Please sign in again before updating your profile.');
    }

    const [{ error: profileError }, { error: preferenceError }] = await Promise.all([
      supabase.from('profiles').upsert({
        id: userId,
        email: useAppStore.getState().session?.email,
        full_name: input.fullName,
        display_name: input.displayName,
        pronouns: input.pronouns,
        birth_year: input.birthYear,
        gender_identity: input.genderIdentity,
        preferred_voice: input.preferredVoice,
        avatar_theme: input.avatarTheme ?? 'mint',
        avatar_url: input.avatarPath ?? null,
      }),
      supabase.from('preferences').upsert({
        user_id: userId,
        smoking_habits: input.smokingHabits,
        drinking_habits: input.drinkingHabits,
        medications_text: input.medicationsText,
        symptoms_text: input.symptomsText,
      }, {
        onConflict: 'user_id',
      }),
    ]);

    if (profileError) {
      throw profileError;
    }

    if (preferenceError) {
      throw preferenceError;
    }

    return dataService.getProfile();
  },

  async uploadAvatar(localUri: string) {
    if (env.isMock) {
      const profile = useAppStore.getState().profile;
      if (profile) {
        useAppStore.getState().hydrateLiveSession(
          {
            ...(useAppStore.getState().session ?? {
              id: profile.id,
              email: profile.email,
              fullName: profile.fullName,
              displayName: profile.displayName,
              onboardingComplete: profile.onboardingComplete,
            }),
            avatarPath: localUri,
            avatarUrl: localUri,
            avatarTheme: profile.avatarTheme,
          },
          { ...profile, avatarPath: localUri, avatarUrl: localUri },
        );
      }
      return { avatarPath: localUri, avatarUrl: localUri };
    }

    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const userId = getLiveUserId();
    if (!userId) {
      throw new Error('Please sign in again before uploading a photo.');
    }

    const imageFile = new ExpoFile(localUri);
    if (!imageFile.exists) {
      throw new Error('BubbleAI could not access that photo yet.');
    }

    const bytes = await imageFile.bytes();
    const filePath = `${userId}/avatar-${Date.now()}.${inferMimeType(localUri).split('/')[1] ?? 'jpg'}`;
    const contentType = inferMimeType(localUri);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, bytes, {
        cacheControl: '3600',
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data, error: signedUrlError } = await supabase.storage
      .from('avatars')
      .createSignedUrl(filePath, avatarSignedUrlTtlSeconds);

    if (signedUrlError || !data?.signedUrl) {
      throw signedUrlError ?? new Error('BubbleAI could not prepare that photo yet.');
    }

    return { avatarPath: filePath, avatarUrl: data.signedUrl };
  },

  async getMedicalId(): Promise<MedicalId | null> {
    if (env.isMock) {
      return useAppStore.getState().medicalId;
    }

    if (!supabase) {
      return null;
    }

    const userId = getLiveUserId();
    if (!userId) {
      return null;
    }

    const { data, error } = await supabase.from('medical_ids').select('*').eq('user_id', userId).maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const medicalId: MedicalId = {
      bloodType: data.blood_type ?? undefined,
      allergies: data.allergies ?? undefined,
      conditions: data.conditions ?? undefined,
      medications: data.medications ?? undefined,
      notes: data.notes ?? undefined,
      clinicianName: data.clinician_name ?? undefined,
      clinicianPhone: data.clinician_phone ?? undefined,
      clinicianAddress: data.clinician_address ?? undefined,
      clinicianMapsUrl: data.clinician_maps_url ?? undefined,
    };

    useAppStore.getState().setMedicalId(medicalId);
    return medicalId;
  },

  async saveMedicalId(values: MedicalId) {
    if (env.isMock) {
      useAppStore.getState().setMedicalId(values);
      return values;
    }

    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const userId = getLiveUserId();
    if (!userId) {
      throw new Error('Please sign in again before saving your medical ID.');
    }

    const { error } = await supabase.from('medical_ids').upsert({
      user_id: userId,
      blood_type: values.bloodType,
      allergies: values.allergies,
      conditions: values.conditions,
      medications: values.medications,
      notes: values.notes,
      clinician_name: values.clinicianName,
      clinician_phone: values.clinicianPhone,
      clinician_address: values.clinicianAddress,
      clinician_maps_url: values.clinicianMapsUrl,
    }, {
      onConflict: 'user_id',
    });

    if (error) {
      throw error;
    }

    useAppStore.getState().setMedicalId(values);
    return values;
  },

  async listTrustedContacts() {
    if (env.isMock) {
      return useAppStore.getState().trustedContacts;
    }

    if (!supabase) {
      return [];
    }

    const userId = getLiveUserId();
    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('trusted_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('is_favorite', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapContact);
  },

  async saveTrustedContact(contact: Omit<ContactRecord, 'id'> & { id?: string }) {
    if (env.isMock) {
      const next = {
        ...contact,
        id: contact.id ?? `trusted-${Date.now()}`,
      } satisfies ContactRecord;
      useAppStore.getState().upsertTrustedContact(next);
      return next;
    }

    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const userId = getLiveUserId();
    if (!userId) {
      throw new Error('Please sign in again before saving a contact.');
    }

    const { data, error } = await supabase
      .from('trusted_contacts')
      .upsert({
        id: contact.id,
        user_id: userId,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        relationship: contact.relationship,
        is_favorite: contact.isFavorite ?? false,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    const next = mapContact(data);
    useAppStore.getState().upsertTrustedContact(next);
    return next;
  },

  async listClinicianContacts() {
    if (env.isMock) {
      return useAppStore.getState().clinicianContacts;
    }

    if (!supabase) {
      return [];
    }

    const userId = getLiveUserId();
    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('clinician_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) =>
      mapContact({
        ...row,
        relationship: 'Clinician',
        is_favorite: true,
      }),
    );
  },

  async saveClinicianContact(contact: Omit<ContactRecord, 'id'> & { id?: string }) {
    if (env.isMock) {
      const next = {
        ...contact,
        id: contact.id ?? `clinician-${Date.now()}`,
      } satisfies ContactRecord;
      useAppStore.getState().upsertClinicianContact(next);
      return next;
    }

    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const userId = getLiveUserId();
    if (!userId) {
      throw new Error('Please sign in again before saving a clinician.');
    }

    const { data, error } = await supabase
      .from('clinician_contacts')
      .upsert({
        id: contact.id,
        user_id: userId,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        notes: contact.notes,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    const next = mapContact({
      ...data,
      relationship: 'Clinician',
      is_favorite: true,
    });
    useAppStore.getState().upsertClinicianContact(next);
    return next;
  },

  async listNotifications(): Promise<NotificationItem[]> {
    if (env.isMock) {
      const { notifications, privacySettings } = useAppStore.getState();
      return notifications.map((item) => ({
        ...item,
        body: privacySettings.hideNotificationPreviews ? 'Notification preview hidden for privacy.' : item.body,
      }));
    }

    const privacySettings = useAppStore.getState().privacySettings;
    const notifications = useAppStore.getState().notifications;

    return notifications.map((item) => ({
      ...item,
      body: privacySettings.hideNotificationPreviews ? 'Notification preview hidden for privacy.' : item.body,
    }));
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

  async getPrivacySettings() {
    if (env.isMock) {
      return useAppStore.getState().privacySettings;
    }

    if (!supabase) {
      return defaultPrivacySettings;
    }

    const userId = getLiveUserId();
    if (!userId) {
      return defaultPrivacySettings;
    }

    const { data, error } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const privacySettings = mapPrivacySettings(data);
    useAppStore.getState().updatePrivacySettings(privacySettings);
    return privacySettings;
  },

  async updatePrivacySettings(settings: Partial<PrivacySettings>) {
    if (env.isMock) {
      useAppStore.getState().updatePrivacySettings(settings);
      return useAppStore.getState().privacySettings;
    }

    if (!supabase) {
      return defaultPrivacySettings;
    }

    const userId = getLiveUserId();
    if (!userId) {
      throw new Error('Please sign in again to update privacy settings.');
    }

    const merged = { ...useAppStore.getState().privacySettings, ...settings };

    const { data, error } = await supabase
      .from('privacy_settings')
      .upsert(
        {
          user_id: userId,
          private_mode: merged.privateMode,
          hide_notification_previews: merged.hideNotificationPreviews,
        },
        { onConflict: 'user_id' },
      )
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    const privacySettings = mapPrivacySettings(data);
    useAppStore.getState().updatePrivacySettings(privacySettings);
    return privacySettings;
  },

  async getCycleProfile() {
    if (env.isMock) {
      return useAppStore.getState().cycleProfile;
    }

    if (!supabase) {
      return null;
    }

    const userId = getLiveUserId();
    if (!userId) {
      return null;
    }

    const { data, error } = await supabase
      .from('cycle_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const cycleProfile = mapCycleProfile(data);
    useAppStore.getState().setCycleProfile(cycleProfile);
    return cycleProfile ? getCycleInsight(cycleProfile) ?? cycleProfile : null;
  },

  async saveCycleProfile(cycleProfile: CycleProfile) {
    if (env.isMock) {
      const nextProfile = getCycleInsight(cycleProfile) ?? cycleProfile;
      useAppStore.getState().setCycleProfile(nextProfile);
      return nextProfile;
    }

    if (!supabase) {
      return null;
    }

    const userId = getLiveUserId();
    if (!userId) {
      throw new Error('Please sign in again before saving cycle support.');
    }

    const { data, error } = await supabase
      .from('cycle_profiles')
      .upsert(
        {
          user_id: userId,
          enabled: cycleProfile.enabled,
          last_period_start: cycleProfile.lastPeriodStart ?? null,
          cycle_length_days: cycleProfile.cycleLengthDays,
          period_length_days: cycleProfile.periodLengthDays,
          irregular_cycles: cycleProfile.irregularCycles,
          symptoms_text: cycleProfile.symptoms.join(', '),
          notes: cycleProfile.notes ?? null,
        },
        { onConflict: 'user_id' },
      )
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    await supabase
      .from('profiles')
      .update({ menstrual_support_enabled: cycleProfile.enabled })
      .eq('id', userId);

    const nextProfile = getCycleInsight(mapCycleProfile(data)) ?? mapCycleProfile(data);
    useAppStore.getState().setCycleProfile(nextProfile);
    return nextProfile;
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

  async listCheckins() {
    if (!env.isMock && supabase) {
      const userId = getLiveUserId();
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapCheckin);
    }

    return useAppStore.getState().checkins;
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
          clientContext: getDeviceContext(),
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

    state.addChatMessage(sessionId, userMessage);

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

  async sendVoiceMessage(sessionId: string, audioUri: string) {
    if (!env.isMock && supabase) {
      if (!isUuid(sessionId) || !getLiveUserId()) {
        throw new Error('Please sign in again before continuing the conversation.');
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Please sign in again before continuing the conversation.');
      }

      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('clientContext', JSON.stringify(getDeviceContext()));
      formData.append(
        'audio',
        {
          uri: audioUri,
          name: `voice-${Date.now()}.m4a`,
          type: 'audio/m4a',
        } as never,
      );

      const response = await fetch(`${env.supabaseUrl}/functions/v1/voice-chat-response`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: env.supabaseAnonKey,
        },
        body: formData,
      });

      const rawText = await response.text();
      const data = parseJsonSafely(rawText);

      if (!response.ok) {
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : rawText || 'BubbleAI could not hear that message clearly.',
        );
      }

      return {
        transcript: String(data?.transcript ?? ''),
        assistantText: String(data?.assistant_text ?? ''),
        riskLevel: (data?.risk_level as ChatMessage['riskLevel']) ?? 'green',
      };
    }

    await delay(700);
    const transcript = 'I want to feel a little calmer tonight.';
    const reply = assistantReply(transcript);
    return {
      transcript,
      assistantText: reply.text,
      riskLevel: reply.risk,
    };
  },

  async listRecommendations(): Promise<Recommendation[]> {
    if (env.isMock) {
      return buildRecommendationsFromData(
        useAppStore.getState().checkins,
        useAppStore.getState().journalEntries,
        useAppStore.getState().cycleProfile,
      );
    }

    const userId = getLiveUserId();
    if (!userId) {
      return [];
    }

    const { checkins, journals } = await fetchLiveWellnessData(userId);
    const cycleProfile = await this.getCycleProfile();
    return buildRecommendationsFromData(checkins, journals, cycleProfile);
  },

  async getVoiceTranscriptPreview() {
    if (env.isMock) {
      return demoVoiceTranscript;
    }

    return [
      'Tap the mic to start a calmer voice check-in.',
      'BubbleAI will transcribe your voice and answer in the same conversation.',
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
        }, {
          onConflict: 'user_id',
        }),
        supabase.from('notification_settings').upsert({
          user_id: session.id,
          enabled: values.notificationsEnabled,
        }, {
          onConflict: 'user_id',
        }),
        supabase.from('privacy_settings').upsert({
          user_id: session.id,
          private_mode: false,
          hide_notification_previews: true,
        }, {
          onConflict: 'user_id',
        }),
        values.menstrualSupportEnabled
          ? supabase.from('cycle_profiles').upsert({
              user_id: session.id,
              enabled: true,
              cycle_length_days: 28,
              period_length_days: 5,
              irregular_cycles: false,
              symptoms_text: '',
            }, {
              onConflict: 'user_id',
            })
          : Promise.resolve(),
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

  async exportMyData() {
    const profile = await this.getProfile();
    const notifications = await this.listNotifications();
    const notificationSettings = await this.getNotificationSettings();
    const privacySettings = await this.getPrivacySettings();
    const cycleProfile = await this.getCycleProfile();
    const medicalId = await this.getMedicalId();
    const trustedContacts = await this.listTrustedContacts();
    const clinicianContacts = await this.listClinicianContacts();
    const journalEntries = await this.listJournalEntries();
    const recommendations = await this.listRecommendations();
    const chatSessions = await this.listChatSessions();
    const checkins = await this.listCheckins();
    const chats = await Promise.all(
      chatSessions.map(async (session) => ({
        session,
        messages: await this.getChatMessages(session.id),
      })),
    );

    const payload = {
      exportedAt: new Date().toISOString(),
      profile,
      privacySettings,
      cycleProfile,
      notificationSettings,
      notifications,
      medicalId,
      trustedContacts,
      clinicianContacts,
      checkins,
      journalEntries,
      recommendations,
      chats,
    };

    const exportFile = new ExpoFile(Paths.cache, `bubbleai-export-${Date.now()}.json`);
    exportFile.create({ intermediates: true, overwrite: true });
    exportFile.write(JSON.stringify(payload, null, 2));

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(exportFile.uri, {
        dialogTitle: 'Export BubbleAI data',
        mimeType: 'application/json',
      });
    }

    return exportFile.uri;
  },

  async deleteAccount() {
    if (env.isMock) {
      useAppStore.getState().clearSession();
      return true;
    }

    await invokeEdgeFunction('delete-account', {});
    await supabase?.auth.signOut();
    useAppStore.getState().clearSession();
    return true;
  },
};
