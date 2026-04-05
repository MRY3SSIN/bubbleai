import { startTransition } from 'react';

import { formatISO } from 'date-fns';

import { authService, supabase } from '@/src/lib/auth';
import { calculateBubbleScore } from '@/src/lib/bubble-score';
import { generateSessionTitle } from '@/src/lib/chat';
import { demoAnalytics, demoDashboard, demoMessagesBySession, demoRecommendations, demoVoiceTranscript } from '@/src/lib/demo-data';
import { env } from '@/src/lib/env';
import { detectRiskLevel } from '@/src/lib/risk';
import { useAppStore } from '@/src/lib/app-store';
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
} from '@/src/types/domain';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

export const dataService = {
  auth: authService,

  async getDashboard(): Promise<DashboardSnapshot> {
    const state = useAppStore.getState();

    return {
      ...demoDashboard,
      bubbleScore: calculateBubbleScore(state.checkins, state.journalEntries),
      recentInsights: demoDashboard.recentInsights,
    };
  },

  async listInsights(): Promise<InsightCard[]> {
    return demoDashboard.recentInsights;
  },

  async getAnalytics(metric: string): Promise<AnalyticsDetail> {
    return demoAnalytics[metric] ?? demoAnalytics.bubble_score;
  },

  async listNotifications(): Promise<NotificationItem[]> {
    return useAppStore.getState().notifications;
  },

  async updateNotificationSettings(settings: Partial<NotificationSettings>) {
    if (!env.isMock && supabase) {
      const userId = useAppStore.getState().session?.id;
      if (userId) {
        const { data, error } = await supabase
          .from('notification_settings')
          .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' })
          .select('*')
          .single();

        if (error) {
          throw error;
        }

        useAppStore.getState().updateNotificationSettings(settings);
        return data;
      }
    }

    useAppStore.getState().updateNotificationSettings(settings);
    return useAppStore.getState().notificationSettings;
  },

  async getNotificationSettings() {
    if (!env.isMock && supabase) {
      const userId = useAppStore.getState().session?.id;
      if (userId) {
        const { data } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (data) {
          return {
            enabled: data.enabled,
            dailyCheckin: data.daily_checkin,
            journaling: data.journaling,
            bedtime: data.bedtime,
            hydration: data.hydration,
            movement: data.movement,
            quietHoursStart: data.quiet_hours_start,
            quietHoursEnd: data.quiet_hours_end,
          };
        }
      }
    }

    return useAppStore.getState().notificationSettings;
  },

  async listJournalEntries() {
    if (!env.isMock && supabase) {
      const userId = useAppStore.getState().session?.id;
      if (userId) {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        return (data ?? []).map((entry) => ({
          id: entry.id,
          title: entry.title,
          createdAt: entry.created_at,
          text: entry.body ?? '',
          transcript: entry.voice_transcript ?? undefined,
          summary: entry.summary ?? '',
          themes: Array.isArray(entry.themes) ? entry.themes : [],
          riskLevel: entry.risk_level,
        }));
      }
    }

    return useAppStore.getState().journalEntries;
  },

  async getJournalEntry(entryId: string) {
    if (!env.isMock && supabase) {
      const { data, error } = await supabase.from('journal_entries').select('*').eq('id', entryId).maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        return {
          id: data.id,
          title: data.title,
          createdAt: data.created_at,
          text: data.body ?? '',
          transcript: data.voice_transcript ?? undefined,
          summary: data.summary ?? '',
          themes: Array.isArray(data.themes) ? data.themes : [],
          riskLevel: data.risk_level,
        };
      }
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
      const userId = useAppStore.getState().session?.id;
      if (userId) {
        const { data, error } = await supabase
          .from('journal_entries')
          .insert({
            user_id: userId,
            title: payload.title,
            body: payload.text,
            summary: payload.summary,
            themes: payload.themes,
            risk_level: payload.riskLevel,
            analysis_status: 'complete',
          })
          .select('*')
          .single();

        if (error) {
          throw error;
        }

        return {
          id: data.id,
          title: data.title,
          createdAt: data.created_at,
          text: data.body ?? '',
          transcript: data.voice_transcript ?? undefined,
          summary: data.summary ?? '',
          themes: Array.isArray(data.themes) ? data.themes : [],
          riskLevel: data.risk_level,
        } satisfies JournalEntry;
      }
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
      const userId = useAppStore.getState().session?.id;
      if (userId) {
        const { error } = await supabase.from('daily_checkins').insert({
          user_id: userId,
          mood: payload.mood,
          stress: payload.stress,
          energy: payload.energy,
          sleep_hours: payload.sleep,
          overwhelm: payload.overwhelm,
          notes: payload.notes,
        });

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
      }
    }

    useAppStore.getState().addCheckin(checkin);
    return checkin;
  },

  async listChatSessions() {
    if (!env.isMock && supabase) {
      const userId = useAppStore.getState().session?.id;
      if (userId) {
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
    }

    return useAppStore.getState().chatSessions;
  },

  async getChatMessages(sessionId: string) {
    if (!env.isMock && supabase) {
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
      const userId = useAppStore.getState().session?.id;
      if (userId) {
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
      const { data, error } = await supabase.functions.invoke('text-chat-response', {
        body: {
          sessionId,
          message: content,
          mode: 'text',
        },
      });

      if (error) {
        throw error;
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
    } else {
      await delay(500);
    }

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
    return demoRecommendations;
  },

  async getVoiceTranscriptPreview() {
    return demoVoiceTranscript;
  },

  async completeOnboarding(values: OnboardingFormValues) {
    if (!env.isMock && supabase) {
      const session = useAppStore.getState().session;
      if (session) {
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
        ]);
      }
    }

    useAppStore.getState().completeOnboarding(values);
    return useAppStore.getState().profile;
  },
};
