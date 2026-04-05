import {
  addDays,
  formatISO,
  subDays,
} from 'date-fns';

import type {
  AnalyticsDetail,
  BubbleScoreBreakdown,
  ChatMessage,
  ChatSession,
  ContactRecord,
  CrisisResource,
  DailyCheckin,
  DashboardSnapshot,
  InsightCard,
  NotificationItem,
  NotificationSettings,
  Profile,
  Recommendation,
  SessionUser,
  TrendPoint,
  JournalEntry,
} from '@/src/types/domain';

const trend = (values: number[], labels: string[]): TrendPoint[] =>
  values.map((value, index) => ({
    label: labels[index] ?? `${index + 1}`,
    value,
    highlight: index === values.length - 1,
  }));

export const demoUser: SessionUser = {
  id: 'user-demo',
  email: 'simar@bubbleai.app',
  fullName: 'Simar Bhatia',
  displayName: 'Simar',
  onboardingComplete: true,
};

export const demoProfile: Profile = {
  id: demoUser.id,
  email: demoUser.email,
  fullName: demoUser.fullName,
  displayName: demoUser.displayName,
  pronouns: 'she/her',
  birthYear: 2003,
  genderIdentity: 'Female',
  preferredVoice: 'neutral_calm',
  medications: ['Vitamin D'],
  diagnoses: ['Overwhelm', 'Sleep trouble'],
  smokingHabits: 'None',
  drinkingHabits: 'Rarely',
  feelingToday: 4,
  stressLevel: 3,
  sleepHours: 7,
  menstrualSupportEnabled: true,
  privacyAcceptedAt: formatISO(subDays(new Date(), 5)),
  aiDisclaimerAcceptedAt: formatISO(subDays(new Date(), 5)),
  crisisDisclaimerAcceptedAt: formatISO(subDays(new Date(), 5)),
  onboardingComplete: true,
};

export const demoNotificationSettings: NotificationSettings = {
  enabled: true,
  dailyCheckin: true,
  journaling: true,
  bedtime: true,
  hydration: true,
  movement: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

export const demoCheckins: DailyCheckin[] = Array.from({ length: 8 }).map((_, index) => ({
  id: `checkin-${index + 1}`,
  createdAt: formatISO(subDays(new Date(), 7 - index)),
  mood: ([3, 4, 4, 5, 4, 4, 5, 4][index] ?? 4) as 1 | 2 | 3 | 4 | 5,
  stress: [6, 5, 4, 3, 5, 4, 3, 4][index] ?? 4,
  energy: [4, 5, 5, 6, 5, 6, 7, 6][index] ?? 5,
  sleep: [6, 7, 7, 8, 6, 7, 8, 7][index] ?? 7,
  overwhelm: [6, 5, 4, 3, 5, 4, 3, 4][index] ?? 4,
  notes: index === 7 ? 'I felt more grounded after a short walk and a simple meal.' : undefined,
}));

export const demoBubbleScore: BubbleScoreBreakdown = {
  total: 251,
  mood: 68,
  stress: 62,
  sleep: 49,
  consistency: 34,
  reflection: 38,
  explanation:
    'Your Bubble Score is built from the last 14 days, with extra weight on your most recent week. Better sleep, steadier mood, lower stress, and staying consistent with check-ins or journaling all lift the score.',
};

export const demoInsightCards: InsightCard[] = [
  {
    id: 'insight-1',
    metric: 'stress',
    title: 'Stress level is softening',
    summary: 'You have been recovering faster after busy days. Small resets seem to be helping.',
    period: 'week',
    chart: trend([4, 3, 3, 2, 2, 2, 1], ['M', 'T', 'W', 'T', 'F', 'S', 'S']),
    accentValue: '1',
  },
  {
    id: 'insight-2',
    metric: 'sleep',
    title: 'Sleep is becoming more steady',
    summary: 'Bedtime reminders and lighter evening routines are helping your sleep rhythm.',
    period: 'month',
    chart: trend([5, 6, 6, 7, 7, 7, 8], ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'Now']),
    accentValue: '6.9 hrs',
  },
  {
    id: 'insight-3',
    metric: 'journal',
    title: 'Journaling is consistent',
    summary: 'You showed up for reflection 5 times this week, which improves self-awareness and pattern tracking.',
    period: 'week',
    chart: trend([1, 0, 1, 1, 0, 1, 1], ['M', 'T', 'W', 'T', 'F', 'S', 'S']),
    accentValue: '5 entries',
  },
];

export const demoDashboard: DashboardSnapshot = {
  greetingDate: 'Sunday, 29 December',
  bubbleScore: demoBubbleScore,
  stressSummary: 'Your stress has eased compared with earlier this week.',
  moodSummary: 'Mood is trending pleasant, with a few wobbly moments around midday.',
  sleepSummary: 'You averaged 6.9 hours, and your bedtime is getting more regular.',
  quickActions: [
    { id: 'qa-analysis', title: 'Take Self Analysis', subtitle: '2 mins', route: '/(tabs)/checkins' },
    { id: 'qa-journal', title: 'Take Journal', subtitle: 'Reflect gently', route: '/journal/new-entry' },
  ],
  recentInsights: demoInsightCards,
};

export const demoNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Time for a gentle check-in',
    body: 'Take two minutes to log your mood and stress before the evening gets busy.',
    category: 'daily_checkin',
    createdAt: formatISO(subDays(new Date(), 0)),
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Bedtime reminder',
    body: 'Try dimming lights and putting your phone down 30 minutes before sleep.',
    category: 'bedtime',
    createdAt: formatISO(subDays(new Date(), 1)),
    read: true,
  },
  {
    id: 'notif-3',
    title: 'Journal nudge',
    body: 'A short brain dump can help you settle after a full day.',
    category: 'journaling',
    createdAt: formatISO(subDays(new Date(), 2)),
    read: true,
  },
];

export const demoRecommendations: Recommendation[] = [
  {
    id: 'rec-1',
    kind: 'hydration',
    title: 'Drink a glass of water',
    description: 'A small reset helps your body and can soften stress fast.',
  },
  {
    id: 'rec-2',
    kind: 'walk',
    title: 'Take a 5 minute walk',
    description: 'A change of environment can loosen overwhelm and improve focus.',
  },
  {
    id: 'rec-3',
    kind: 'journal',
    title: 'Try a one line journal prompt',
    description: 'What feels heaviest right now, and what would make today 5% easier?',
  },
];

export const demoJournalEntries: JournalEntry[] = [
  {
    id: 'journal-1',
    title: 'Feeling Bad Again',
    createdAt: formatISO(subDays(new Date(), 1)),
    text:
      'I felt pressure building all day and started worrying I would fall behind again. A short walk helped a little, but my thoughts stayed noisy.',
    summary:
      'The entry shows overwhelm connected to workload and fear of falling behind. Grounding and task breakdown were helpful.',
    themes: ['stress', 'study pressure', 'self-talk'],
    riskLevel: 'yellow',
  },
  {
    id: 'journal-2',
    title: 'A calmer morning',
    createdAt: formatISO(subDays(new Date(), 3)),
    text:
      'I slept better, ate breakfast, and felt more steady. I want to keep this rhythm going.',
    summary:
      'This entry reflects positive momentum, a steadier sleep pattern, and healthy routine anchors.',
    themes: ['sleep', 'routine', 'confidence'],
    riskLevel: 'green',
  },
];

export const demoChatSessions: ChatSession[] = [
  {
    id: 'chat-1',
    title: 'Feeling overwhelmed before exams',
    mode: 'text',
    lastMessageAt: formatISO(subDays(new Date(), 0)),
    preview: 'I tried the breathing exercises yesterday and they helped a bit.',
    riskState: 'green',
  },
  {
    id: 'chat-2',
    title: 'Evening reset',
    mode: 'voice',
    lastMessageAt: formatISO(subDays(new Date(), 2)),
    preview: 'Let’s slow down and ease into the night gently.',
    riskState: 'green',
  },
];

export const demoMessagesBySession: Record<string, ChatMessage[]> = {
  'chat-1': [
    {
      id: 'msg-1',
      role: 'assistant',
      content:
        'It sounds like the pressure is piling up. We can keep this simple, what feels most urgent right now?',
      createdAt: formatISO(subDays(new Date(), 1)),
    },
    {
      id: 'msg-2',
      role: 'user',
      content:
        'I tried the breathing exercises yesterday, and they actually helped a bit. Still feeling a bit stressed though. Any more tips?',
      createdAt: formatISO(subDays(new Date(), 0)),
    },
    {
      id: 'msg-3',
      role: 'assistant',
      content:
        'I’m glad that helped a little. For today, try one 20 minute focus block, keep water nearby, and write the next tiny step instead of the whole plan.',
      createdAt: formatISO(subDays(new Date(), 0)),
    },
  ],
};

export const demoAnalytics: Record<string, AnalyticsDetail> = {
  sleep: {
    metric: 'sleep',
    title: 'Sleep',
    value: '6.9 hrs/day',
    subtitle: 'Average sleep this week',
    period: 'year',
    gaugeValue: 7,
    gaugeMax: 10,
    trend: trend([5, 7, 6, 6, 7, 8, 7], ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    insight: 'Your sleep is improving when your evenings are simpler and more predictable.',
  },
  stress: {
    metric: 'stress',
    title: 'Stress Level',
    value: '1',
    subtitle: 'Current stress level',
    period: 'week',
    gaugeValue: 1,
    gaugeMax: 5,
    trend: trend([4, 3, 3, 2, 2, 2, 1], ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    insight: 'Stress is trending down. Pauses, hydration, and smaller task chunks are helping.',
  },
  mood: {
    metric: 'mood',
    title: 'Mood Progress',
    value: 'Very Pleasant',
    subtitle: 'Today',
    period: 'month',
    gaugeValue: 4,
    gaugeMax: 5,
    trend: trend([2, 2, 3, 4, 3, 4, 4], ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'Now']),
    insight: 'Your mood improves when you keep light structure and a gentler evening wind down.',
  },
  bubble_score: {
    metric: 'bubble_score',
    title: 'Bubble Score',
    value: '251',
    subtitle: 'Overall progress',
    period: 'month',
    gaugeValue: 251,
    gaugeMax: 300,
    trend: trend([180, 196, 210, 223, 234, 244, 251], ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'Now']),
    insight: demoBubbleScore.explanation,
  },
};

export const crisisResources: CrisisResource[] = [
  {
    countryCode: 'MY',
    title: 'Befrienders Kuala Lumpur',
    phone: '03-7627 2929',
    description: 'Malaysia-first default emotional support line.',
  },
  {
    countryCode: 'US',
    title: '988 Suicide & Crisis Lifeline',
    phone: '988',
    description: 'Call or text 988 in the United States for immediate crisis help.',
  },
  {
    countryCode: 'DEFAULT',
    title: 'Local emergency services',
    phone: '112',
    description: 'If you are in immediate danger, call your local emergency number now.',
  },
];

export const demoContacts: ContactRecord[] = [
  {
    id: 'contact-1',
    name: 'Dr. Maya Tan',
    relationship: 'Clinician',
    phone: '+60 12-555 0191',
    email: 'maya.tan@bubbleai.example',
    isFavorite: true,
  },
  {
    id: 'contact-2',
    name: 'Aina',
    relationship: 'Trusted person',
    phone: '+60 12-555 0188',
    isFavorite: true,
  },
];

export const demoVoiceTranscript = [
  'I hear a lot of pressure in what you’re carrying.',
  'Let’s slow it down and find one small next step.',
  'You could start with water, one deep breath, and one easy task.',
];

export const futureDates = Array.from({ length: 5 }).map((_, index) => formatISO(addDays(new Date(), index + 1)));
