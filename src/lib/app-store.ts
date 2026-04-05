import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  demoChatSessions,
  demoCheckins,
  demoContacts,
  demoJournalEntries,
  demoMessagesBySession,
  demoNotificationSettings,
  demoNotifications,
  demoProfile,
  demoUser,
} from '@/src/lib/demo-data';
import { env } from '@/src/lib/env';
import { secureStoreStorage } from '@/src/lib/secure-store';
import type {
  ChatMessage,
  ChatSession,
  ContactRecord,
  DailyCheckin,
  JournalEntry,
  MoodValue,
  NotificationItem,
  NotificationSettings,
  OnboardingFormValues,
  Profile,
  SessionUser,
} from '@/src/types/domain';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value?: string | null) => Boolean(value && uuidPattern.test(value));

const createRuntimeData = (isMockRuntime: boolean) => ({
  session: isMockRuntime ? demoUser : null,
  profile: isMockRuntime ? demoProfile : null,
  notifications: isMockRuntime ? demoNotifications : [],
  journalEntries: isMockRuntime ? [...demoJournalEntries] : [],
  checkins: isMockRuntime ? demoCheckins : [],
  chatSessions: isMockRuntime ? demoChatSessions : [],
  chatMessages: isMockRuntime ? demoMessagesBySession : {},
  clinicianContacts: isMockRuntime
    ? demoContacts.filter((contact) => contact.relationship === 'Clinician')
    : [],
  trustedContacts: isMockRuntime
    ? demoContacts.filter((contact) => contact.relationship !== 'Clinician')
    : [],
});

type RuntimeData = ReturnType<typeof createRuntimeData>;

type AppState = RuntimeData & {
  hydrated: boolean;
  pendingVerificationEmail: string;
  onboardingDraft: Partial<OnboardingFormValues>;
  notificationSettings: NotificationSettings;
  setHydrated: () => void;
  setSession: (session: SessionUser | null) => void;
  hydrateLiveSession: (session: SessionUser, profile: Profile | null) => void;
  setPendingVerification: (email: string) => void;
  setOnboardingDraft: (values: Partial<OnboardingFormValues>) => void;
  clearSession: () => void;
  completeOnboarding: (values: OnboardingFormValues) => void;
  addCheckin: (checkin: DailyCheckin) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  addChatSession: (session: ChatSession) => void;
  addChatMessage: (sessionId: string, message: ChatMessage) => void;
  markNotificationRead: (id: string) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  upsertTrustedContact: (contact: ContactRecord) => void;
  upsertClinicianContact: (contact: ContactRecord) => void;
};

const runtimeDefaults = createRuntimeData(env.isMock);

const createState: StateCreator<AppState> = (set) => ({
  hydrated: false,
  pendingVerificationEmail: '',
  onboardingDraft: {},
  notificationSettings: demoNotificationSettings,
  ...runtimeDefaults,
  setHydrated: () => set({ hydrated: true }),
  setSession: (session: SessionUser | null) => set({ session }),
  hydrateLiveSession: (session: SessionUser, profile: Profile | null) => set({ session, profile }),
  setPendingVerification: (email: string) => set({ pendingVerificationEmail: email }),
  setOnboardingDraft: (values: Partial<OnboardingFormValues>) =>
    set((state) => ({
      onboardingDraft: {
        ...state.onboardingDraft,
        ...values,
      },
    })),
  clearSession: () =>
    set({
      ...createRuntimeData(false),
      session: null,
      profile: null,
      pendingVerificationEmail: '',
      onboardingDraft: {},
    }),
  completeOnboarding: (values: OnboardingFormValues) =>
    set((state) => ({
      session: state.session
        ? {
            ...state.session,
            fullName: values.fullName,
            displayName: values.displayName,
            onboardingComplete: true,
          }
        : state.session,
      profile: state.session
        ? {
            ...demoProfile,
            id: state.session.id,
            email: state.session.email,
            fullName: values.fullName,
            displayName: values.displayName,
            pronouns: values.pronouns,
            birthYear: values.birthYear,
            genderIdentity: values.genderIdentity,
            preferredVoice: values.preferredVoice,
            medications: values.medicationsEnabled
              ? values.medicationsText
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean)
              : [],
            diagnoses: values.symptomsText
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean),
            smokingHabits: values.smokingHabits,
            drinkingHabits: values.drinkingHabits,
            feelingToday: values.feelingToday as MoodValue,
            stressLevel: values.stressLevel,
            sleepHours: values.sleepHours,
            menstrualSupportEnabled: values.menstrualSupportEnabled,
            onboardingComplete: true,
            privacyAcceptedAt: new Date().toISOString(),
            aiDisclaimerAcceptedAt: new Date().toISOString(),
            crisisDisclaimerAcceptedAt: new Date().toISOString(),
          }
        : state.profile,
      notificationSettings: {
        ...state.notificationSettings,
        enabled: values.notificationsEnabled,
      },
    })),
  addCheckin: (checkin: DailyCheckin) => set((state) => ({ checkins: [checkin, ...state.checkins] })),
  addJournalEntry: (entry: JournalEntry) =>
    set((state) => ({ journalEntries: [entry, ...state.journalEntries] })),
  addChatSession: (session: ChatSession) =>
    set((state) => ({ chatSessions: [session, ...state.chatSessions] })),
  addChatMessage: (sessionId: string, message: ChatMessage) =>
    set((state) => ({
      chatMessages: {
        ...state.chatMessages,
        [sessionId]: [...(state.chatMessages[sessionId] ?? []), message],
      },
    })),
  markNotificationRead: (id: string) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    })),
  updateNotificationSettings: (settings: Partial<NotificationSettings>) =>
    set((state) => ({
      notificationSettings: { ...state.notificationSettings, ...settings },
    })),
  upsertTrustedContact: (contact: ContactRecord) =>
    set((state) => ({
      trustedContacts: [contact, ...state.trustedContacts.filter((item) => item.id !== contact.id)],
    })),
  upsertClinicianContact: (contact: ContactRecord) =>
    set((state) => ({
      clinicianContacts: [
        contact,
        ...state.clinicianContacts.filter((item) => item.id !== contact.id),
      ],
    })),
});

export const useAppStore = create<AppState>()(
  persist(createState, {
    name: 'bubbleai-store',
    version: 2,
    storage: createJSONStorage(() => secureStoreStorage),
    partialize: (state) => ({
      session: state.session,
      pendingVerificationEmail: state.pendingVerificationEmail,
      onboardingDraft: state.onboardingDraft,
      profile: state.profile,
      notificationSettings: state.notificationSettings,
      clinicianContacts: state.clinicianContacts,
      trustedContacts: state.trustedContacts,
    }),
    migrate: (persistedState) => {
      const state = (persistedState ?? {}) as Partial<AppState>;

      if (!env.isMock && state.session && !isUuid(state.session.id)) {
        return {
          ...state,
          session: null,
          profile: null,
          clinicianContacts: [],
          trustedContacts: [],
        };
      }

      return state;
    },
    onRehydrateStorage: () => (state) => {
      if (!env.isMock && state?.session && !isUuid(state.session.id)) {
        state.clearSession();
      }

      state?.setHydrated();
    },
  }),
);

export const initializeMockState = () => {
  const state = useAppStore.getState();

  if (!env.isMock) {
    if (!state.hydrated) {
      state.setHydrated();
    }
    return;
  }

  if (!state.hydrated) {
    state.setHydrated();
  }
};

export const hasLiveSession = () => {
  if (env.isMock) {
    return false;
  }

  return isUuid(useAppStore.getState().session?.id);
};
