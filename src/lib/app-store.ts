import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { demoChatSessions, demoCheckins, demoContacts, demoJournalEntries, demoMessagesBySession, demoNotificationSettings, demoNotifications, demoProfile, demoUser } from '@/src/lib/demo-data';
import { secureStoreStorage } from '@/src/lib/secure-store';
import type {
  ChatMessage,
  ChatSession,
  ContactRecord,
  DailyCheckin,
  JournalEntry,
  NotificationItem,
  NotificationSettings,
  OnboardingFormValues,
  Profile,
  SessionUser,
  MoodValue,
} from '@/src/types/domain';

type AppState = {
  hydrated: boolean;
  session: SessionUser | null;
  pendingVerificationEmail: string;
  onboardingDraft: Partial<OnboardingFormValues>;
  profile: Profile | null;
  notificationSettings: NotificationSettings;
  notifications: NotificationItem[];
  journalEntries: JournalEntry[];
  checkins: DailyCheckin[];
  chatSessions: ChatSession[];
  chatMessages: Record<string, ChatMessage[]>;
  clinicianContacts: ContactRecord[];
  trustedContacts: ContactRecord[];
  setHydrated: () => void;
  setSession: (session: SessionUser | null) => void;
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      session: demoUser,
      pendingVerificationEmail: '',
      onboardingDraft: {},
      profile: demoProfile,
      notificationSettings: demoNotificationSettings,
      notifications: demoNotifications,
      journalEntries: [...demoJournalEntries],
      checkins: demoCheckins,
      chatSessions: demoChatSessions,
      chatMessages: demoMessagesBySession,
      clinicianContacts: demoContacts.filter((contact) => contact.relationship === 'Clinician'),
      trustedContacts: demoContacts.filter((contact) => contact.relationship !== 'Clinician'),
      setHydrated: () => set({ hydrated: true }),
      setSession: (session) => set({ session }),
      setPendingVerification: (email) => set({ pendingVerificationEmail: email }),
      setOnboardingDraft: (values) =>
        set((state) => ({
          onboardingDraft: {
            ...state.onboardingDraft,
            ...values,
          },
        })),
      clearSession: () =>
        set({
          session: null,
          profile: null,
          pendingVerificationEmail: '',
          onboardingDraft: {},
        }),
      completeOnboarding: (values) =>
        set((state) => ({
          session: state.session
            ? { ...state.session, fullName: values.fullName, displayName: values.displayName, onboardingComplete: true }
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
                  ? values.medicationsText.split(',').map((value) => value.trim()).filter(Boolean)
                  : [],
                diagnoses: values.symptomsText.split(',').map((value) => value.trim()).filter(Boolean),
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
      addCheckin: (checkin) => set((state) => ({ checkins: [checkin, ...state.checkins] })),
      addJournalEntry: (entry) => set((state) => ({ journalEntries: [entry, ...state.journalEntries] })),
      addChatSession: (session) => set((state) => ({ chatSessions: [session, ...state.chatSessions] })),
      addChatMessage: (sessionId, message) =>
        set((state) => ({
          chatMessages: {
            ...state.chatMessages,
            [sessionId]: [...(state.chatMessages[sessionId] ?? []), message],
          },
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id ? { ...item, read: true } : item,
          ),
        })),
      updateNotificationSettings: (settings) =>
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...settings },
        })),
      upsertTrustedContact: (contact) =>
        set((state) => ({
          trustedContacts: [
            contact,
            ...state.trustedContacts.filter((item) => item.id !== contact.id),
          ],
        })),
      upsertClinicianContact: (contact) =>
        set((state) => ({
          clinicianContacts: [
            contact,
            ...state.clinicianContacts.filter((item) => item.id !== contact.id),
          ],
        })),
    }),
    {
      name: 'bubbleai-store',
      storage: createJSONStorage(() => secureStoreStorage),
      partialize: (state) => ({
        session: state.session,
        pendingVerificationEmail: state.pendingVerificationEmail,
        onboardingDraft: state.onboardingDraft,
        profile: state.profile,
        notificationSettings: state.notificationSettings,
        notifications: state.notifications,
        journalEntries: state.journalEntries,
        checkins: state.checkins,
        chatSessions: state.chatSessions,
        chatMessages: state.chatMessages,
        clinicianContacts: state.clinicianContacts,
        trustedContacts: state.trustedContacts,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

export const initializeMockState = () => {
  const state = useAppStore.getState();
  if (!state.hydrated) {
    state.setHydrated();
  }
};
