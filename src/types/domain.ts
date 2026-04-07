export type AppEnvironment = 'mock' | 'development' | 'staging' | 'production';

export type RiskLevel = 'green' | 'yellow' | 'red';
export type ChatMode = 'text' | 'voice';
export type VoicePreset = 'feminine' | 'masculine' | 'neutral_calm';
export type InsightPeriod = 'week' | 'month' | '6_month' | 'year';
export type AvatarTheme = 'mint' | 'ocean' | 'sunrise' | 'lavender' | 'forest';
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
export type RecommendationKind =
  | 'hydration'
  | 'walk'
  | 'stretch'
  | 'breathing'
  | 'journal'
  | 'sleep'
  | 'meal'
  | 'reach_out'
  | 'contact_clinician';

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  avatarPath?: string;
  avatarUrl?: string;
  avatarTheme?: AvatarTheme;
  onboardingComplete: boolean;
};

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  pronouns?: string;
  birthYear?: number;
  genderIdentity?: string;
  preferredVoice: VoicePreset;
  avatarPath?: string;
  avatarUrl?: string;
  avatarTheme?: AvatarTheme;
  medications?: string[];
  diagnoses?: string[];
  smokingHabits?: string;
  drinkingHabits?: string;
  feelingToday?: MoodValue;
  stressLevel?: number;
  sleepHours?: number;
  menstrualSupportEnabled: boolean;
  privacyAcceptedAt?: string;
  aiDisclaimerAcceptedAt?: string;
  crisisDisclaimerAcceptedAt?: string;
  onboardingComplete: boolean;
};

export type NotificationCategory =
  | 'daily_checkin'
  | 'journaling'
  | 'bedtime'
  | 'hydration'
  | 'movement';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  createdAt: string;
  read: boolean;
};

export type NotificationSettings = {
  enabled: boolean;
  dailyCheckin: boolean;
  journaling: boolean;
  bedtime: boolean;
  hydration: boolean;
  movement: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};

export type PrivacySettings = {
  privateMode: boolean;
  hideNotificationPreviews: boolean;
};

export type CycleProfile = {
  enabled: boolean;
  lastPeriodStart?: string;
  cycleLengthDays: number;
  periodLengthDays: number;
  irregularCycles: boolean;
  symptoms: string[];
  notes?: string;
  currentPhase?: CyclePhase;
  cycleDay?: number;
  nextPeriodInDays?: number;
};

export type BubbleScoreBreakdown = {
  total: number;
  mood: number;
  stress: number;
  sleep: number;
  consistency: number;
  reflection: number;
  explanation: string;
};

export type TrendPoint = {
  label: string;
  value: number;
  highlight?: boolean;
};

export type InsightCard = {
  id: string;
  metric: 'bubble_score' | 'stress' | 'mood' | 'sleep' | 'journal' | 'routine';
  title: string;
  summary: string;
  period: InsightPeriod;
  chart: TrendPoint[];
  accentValue?: string;
};

export type DashboardSnapshot = {
  greetingDate: string;
  bubbleScore: BubbleScoreBreakdown;
  stressSummary: string;
  moodSummary: string;
  sleepSummary: string;
  quickActions: Array<{
    id: string;
    title: string;
    subtitle: string;
    route: string;
  }>;
  recentInsights: InsightCard[];
};

export type DailyCheckin = {
  id: string;
  createdAt: string;
  mood: MoodValue;
  stress: number;
  energy: number;
  sleep: number;
  overwhelm: number;
  notes?: string;
};

export type JournalEntry = {
  id: string;
  title: string;
  createdAt: string;
  text: string;
  transcript?: string;
  summary: string;
  themes: string[];
  riskLevel: RiskLevel;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  riskLevel?: RiskLevel;
};

export type ChatSession = {
  id: string;
  title: string;
  mode: ChatMode;
  lastMessageAt: string;
  preview: string;
  riskState: RiskLevel;
};

export type AnalyticsDetail = {
  metric: 'sleep' | 'stress' | 'mood' | 'bubble_score';
  title: string;
  value: string;
  subtitle: string;
  period: InsightPeriod;
  gaugeValue: number;
  gaugeMax: number;
  trend: TrendPoint[];
  insight: string;
};

export type ContactRecord = {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  isFavorite?: boolean;
  notes?: string;
};

export type MedicalId = {
  bloodType?: string;
  allergies?: string;
  conditions?: string;
  medications?: string;
  notes?: string;
  clinicianName?: string;
  clinicianPhone?: string;
  clinicianAddress?: string;
  clinicianMapsUrl?: string;
};

export type Recommendation = {
  id: string;
  kind: RecommendationKind;
  title: string;
  description: string;
};

export type CrisisResource = {
  countryCode: string;
  title: string;
  phone: string;
  description: string;
};

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export type OnboardingFormValues = {
  fullName: string;
  displayName: string;
  pronouns?: string;
  birthYear?: number;
  genderIdentity: string;
  preferredVoice: VoicePreset;
  medicationsEnabled: boolean;
  medicationsText: string;
  symptomsText: string;
  smokingHabits: string;
  drinkingHabits: string;
  feelingToday: number;
  stressLevel: number;
  sleepHours: number;
  notificationsEnabled: boolean;
  menstrualSupportEnabled: boolean;
  privacyAccepted: boolean;
  aiDisclaimerAccepted: boolean;
  crisisDisclaimerAccepted: boolean;
};
