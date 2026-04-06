import { createServiceClient } from './supabase.ts';

type ServiceClient = ReturnType<typeof createServiceClient>;

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const parseCsv = (value?: string | null) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const deriveAge = (birthYear?: number | null) => {
  if (!birthYear) {
    return null;
  }

  return new Date().getUTCFullYear() - birthYear;
};

export const loadConversationContext = async (
  supabase: ServiceClient,
  userId: string,
  sessionId: string,
) => {
  const [
    { data: profile },
    { data: preferences },
    { data: medicalId },
    { data: cycleProfile },
    { data: recentCheckins },
    { data: recentJournals },
    { data: priorMessages },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('preferences').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('medical_ids').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('cycle_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(7),
    supabase
      .from('journal_entries')
      .select('title, summary, risk_level, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(18),
  ]);

  const latestCheckin = recentCheckins?.[0];
  const avgMood = average((recentCheckins ?? []).map((item) => Number(item.mood ?? 0)));
  const avgStress = average((recentCheckins ?? []).map((item) => Number(item.stress ?? 0)));
  const avgSleep = average((recentCheckins ?? []).map((item) => Number(item.sleep_hours ?? 0)));

  return {
    profile,
    preferences,
    medicalId,
    cycleProfile,
    recentCheckins: recentCheckins ?? [],
    recentJournals: recentJournals ?? [],
    priorMessages: priorMessages ?? [],
    derived: {
      age: deriveAge(typeof profile?.birth_year === 'number' ? profile.birth_year : null),
      medications: Array.from(
        new Set([
          ...parseCsv(typeof preferences?.medications_text === 'string' ? preferences.medications_text : ''),
          ...parseCsv(typeof medicalId?.medications === 'string' ? medicalId.medications : ''),
        ]),
      ),
      diagnoses: parseCsv(
        typeof preferences?.symptoms_text === 'string' ? preferences.symptoms_text : '',
      ),
      latestCheckin,
      avgMood: Number.isFinite(avgMood) ? Number(avgMood.toFixed(1)) : 0,
      avgStress: Number.isFinite(avgStress) ? Number(avgStress.toFixed(1)) : 0,
      avgSleep: Number.isFinite(avgSleep) ? Number(avgSleep.toFixed(1)) : 0,
    },
  };
};

export const formatConversationHistory = (
  priorMessages: Array<{ role?: string | null; content?: string | null }>,
) => {
  if (!priorMessages.length) {
    return 'No earlier turns in this conversation yet.';
  }

  return priorMessages
    .map((item) => `${item.role === 'assistant' ? 'BubbleAI' : item.role === 'user' ? 'User' : 'System'}: ${item.content ?? ''}`)
    .join('\n');
};

export const buildAssistantInstructions = ({
  mode,
  clientContext,
  context,
  systemPrompt,
  safetyPrompt,
}: {
  mode: 'text' | 'voice';
  clientContext?: Record<string, unknown> | null;
  context: Awaited<ReturnType<typeof loadConversationContext>>;
  systemPrompt: string;
  safetyPrompt: string;
}) => {
  const { profile, preferences, medicalId, cycleProfile, recentJournals, derived } = context;
  const region =
    (typeof clientContext?.region === 'string' && clientContext.region) ||
    'MY';
  const locale =
    (typeof clientContext?.locale === 'string' && clientContext.locale) ||
    'en-MY';
  const timezone =
    (typeof clientContext?.timezone === 'string' && clientContext.timezone) ||
    'Asia/Kuala_Lumpur';

  return `
${systemPrompt}

${safetyPrompt}

Reply in a fresh, natural way. Keep it warm, easy to understand, and concise.
Conversation mode: ${mode}
Locale: ${locale}
Region: ${region}
Timezone: ${timezone}

User profile:
- Name: ${profile?.display_name ?? profile?.full_name ?? 'Unknown'}
- Age: ${derived.age ?? 'Unknown'}
- Gender identity: ${profile?.gender_identity ?? 'Unknown'}
- Pronouns: ${profile?.pronouns ?? 'Unknown'}
- Preferred voice: ${profile?.preferred_voice ?? 'neutral_calm'}
- Menstrual support enabled: ${profile?.menstrual_support_enabled ? 'yes' : 'no'}

Medical and wellness context:
- Approximate location: ${region}
- Medical ID blood type: ${medicalId?.blood_type ?? 'Not set'}
- Medical ID allergies: ${medicalId?.allergies ?? 'Not set'}
- Medical ID conditions: ${medicalId?.conditions ?? 'Not set'}
- Medical ID medications: ${medicalId?.medications ?? 'Not set'}
- Clinician name: ${medicalId?.clinician_name ?? 'Not set'}
- Clinician phone: ${medicalId?.clinician_phone ?? 'Not set'}
- Clinician address: ${medicalId?.clinician_address ?? 'Not set'}
- Saved medications: ${derived.medications.join(', ') || 'None saved'}
- Saved symptoms or diagnoses: ${derived.diagnoses.join(', ') || 'None saved'}
- Smoking habits: ${preferences?.smoking_habits ?? 'Unknown'}
- Drinking habits: ${preferences?.drinking_habits ?? 'Unknown'}
- Latest stress level: ${derived.latestCheckin?.stress ?? 'Unknown'}
- Latest mood level: ${derived.latestCheckin?.mood ?? 'Unknown'}
- Latest sleep hours: ${derived.latestCheckin?.sleep_hours ?? 'Unknown'}
- Latest energy level: ${derived.latestCheckin?.energy ?? 'Unknown'}
- Latest overwhelm level: ${derived.latestCheckin?.overwhelm ?? 'Unknown'}
- 7 day average stress: ${derived.avgStress || 'Unknown'}
- 7 day average mood: ${derived.avgMood || 'Unknown'}
- 7 day average sleep hours: ${derived.avgSleep || 'Unknown'}

Cycle support context:
${cycleProfile ? JSON.stringify(cycleProfile, null, 2) : 'Not active'}

Recent journals:
${recentJournals.length ? JSON.stringify(recentJournals, null, 2) : 'No recent journals'}
`.trim();
};
