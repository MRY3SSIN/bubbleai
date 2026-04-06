import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  demoChatSessions,
  demoCheckins,
  demoCycleProfile,
  demoContacts,
  demoJournalEntries,
  demoMessagesBySession,
  demoNotificationSettings,
  demoNotifications,
  demoPrivacySettings,
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
  MedicalId,
  MoodValue,
  NotificationItem,
  NotificationSettings,
  OnboardingFormValues,
  PrivacySettings,
  Profile,
  SessionUser,
  CycleProfile,
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
  privacySettings: isMockRuntime ? demoPrivacySettings : { privateMode: false, hideNotificationPreviews: true },
  cycleProfile: isMockRuntime ? demoCycleProfile : null,
});

type RuntimeData = ReturnType<typeof createRuntimeData>;

type AppState = RuntimeData & {
  hydrated: boolean;
  pendingVerificationEmail: string;
  onboardingDraft: Partial<OnboardingFormValues>;
  medicalId: MedicalId | null;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  cycleProfile: CycleProfile | null;
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
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  upsertTrustedContact: (contact: ContactRecord) => void;
  upsertClinicianContact: (contact: ContactRecord) => void;
  setMedicalId: (medicalId: MedicalId | null) => void;
  setCycleProfile: (cycleProfile: CycleProfile | null) => void;
};

const runtimeDefaults = createRuntimeData(env.isMock);

const createState: StateCreator<AppState> = (set) => ({
  ...runtimeDefaults,
  hydrated: false,
  pendingVerificationEmail: '',
  onboardingDraft: {},
  medicalId: null,
  notificationSettings: demoNotificationSettings,
  privacySettings: runtimeDefaults.privacySettings,
  cycleProfile: runtimeDefaults.cycleProfile,
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
      medicalId: null,
      cycleProfile: null,
      pendingVerificationEmail: '',
      onboardingDraft: {},
      privacySettings: { privateMode: false, hideNotificationPreviews: true },
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
            avatarTheme: state.profile?.avatarTheme ?? 'mint',
            avatarUrl: state.profile?.avatarUrl,
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
      cycleProfile: values.menstrualSupportEnabled
        ? state.cycleProfile ?? {
            enabled: true,
            cycleLengthDays: 28,
            periodLengthDays: 5,
            irregularCycles: false,
            symptoms: [],
          }
        : null,
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
  updatePrivacySettings: (settings: Partial<PrivacySettings>) =>
    set((state) => ({
      privacySettings: { ...state.privacySettings, ...settings },
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
  setMedicalId: (medicalId: MedicalId | null) => set({ medicalId }),
  setCycleProfile: (cycleProfile: CycleProfile | null) => set({ cycleProfile }),
});

export const useAppStore = create<AppState>()(
  persist(createState, {
    name: 'bubbleai-store',
    version: 3,
    storage: createJSONStorage(() => secureStoreStorage),
    partialize: (state) => ({
      session: state.session,
      pendingVerificationEmail: state.pendingVerificationEmail,
      onboardingDraft: state.onboardingDraft,
      profile: state.profile,
      medicalId: state.medicalId,
      notificationSettings: state.notificationSettings,
      privacySettings: state.privacySettings,
      cycleProfile: state.cycleProfile,
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
          medicalId: null,
          clinicianContacts: [],
          trustedContacts: [],
        };
      }

      return {
        ...state,
        privacySettings: state.privacySettings ?? {
          privateMode: false,
          hideNotificationPreviews: true,
        },
        cycleProfile: state.cycleProfile ?? null,
      };
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
