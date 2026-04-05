import { createClient } from '@supabase/supabase-js';

import { env } from '@/src/lib/env';
import { secureStoreStorage } from '@/src/lib/secure-store';
import { useAppStore } from '@/src/lib/app-store';
import type { Profile, SessionUser } from '@/src/types/domain';

export const supabase = env.supabaseUrl && env.supabaseAnonKey
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: secureStoreStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

type Credentials = {
  email: string;
  password: string;
  fullName?: string;
};

const mapAuthError = (error: { message: string }) => {
  const message = error.message.toLowerCase();

  if (message.includes('email rate limit exceeded')) {
    return new Error(
      'Too many email codes were requested for this address. Please wait a little and try again.',
    );
  }

  if (message.includes('user already registered')) {
    return new Error('This email already has an account. Try logging in instead.');
  }

  if (message.includes('invalid login credentials')) {
    return new Error('That email or password does not look right yet.');
  }

  return error;
};

const createMockUser = (credentials: Credentials): SessionUser => ({
  id: `mock-${credentials.email}`,
  email: credentials.email,
  fullName: credentials.fullName ?? 'BubbleAI User',
  displayName: credentials.fullName?.split(' ')[0] ?? 'Friend',
  onboardingComplete: false,
});

const mapSessionUser = (
  user: {
    id: string;
    email?: string | null;
    user_metadata: Record<string, unknown>;
  },
  fallbackEmail?: string,
  profile?: Profile | null,
): SessionUser => ({
  id: user.id,
  email: user.email ?? fallbackEmail ?? '',
  fullName:
    profile?.fullName ??
    (user.user_metadata.full_name as string | undefined) ??
    'BubbleAI User',
  displayName:
    profile?.displayName ??
    (user.user_metadata.display_name as string | undefined) ??
    ((user.user_metadata.full_name as string | undefined)?.split(' ')[0] ?? 'Friend'),
  onboardingComplete:
    Boolean(profile?.onboardingComplete) || Boolean(user.user_metadata.onboarding_complete),
});

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    displayName: data.display_name,
    pronouns: data.pronouns ?? undefined,
    birthYear: data.birth_year ?? undefined,
    genderIdentity: data.gender_identity ?? undefined,
    preferredVoice: data.preferred_voice,
    medications: [],
    diagnoses: [],
    smokingHabits: undefined,
    drinkingHabits: undefined,
    menstrualSupportEnabled: Boolean(data.menstrual_support_enabled),
    privacyAcceptedAt: data.privacy_accepted_at ?? undefined,
    aiDisclaimerAcceptedAt: data.ai_disclaimer_accepted_at ?? undefined,
    crisisDisclaimerAcceptedAt: data.crisis_disclaimer_accepted_at ?? undefined,
    onboardingComplete: Boolean(data.onboarding_complete),
  } satisfies Profile;
};

export const authService = {
  async login(credentials: Credentials) {
    if (env.isMock || !supabase) {
      const user = createMockUser(credentials);
      useAppStore.getState().setSession(user);
      return user;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw mapAuthError(error);
    }

    const profile = await fetchProfile(data.user.id);
    const sessionUser = mapSessionUser(data.user, credentials.email, profile);

    useAppStore.getState().hydrateLiveSession(sessionUser, profile);
    return sessionUser;
  },

  async signup(credentials: Credentials) {
    if (env.isMock || !supabase) {
      const user = createMockUser(credentials);
      useAppStore.getState().setPendingVerification(credentials.email);
      return user;
    }

    const { error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName,
          display_name: credentials.fullName?.split(' ')[0],
        },
      },
    });

    if (error) {
      throw mapAuthError(error);
    }

    useAppStore.getState().setPendingVerification(credentials.email);
    return createMockUser(credentials);
  },

  async sendForgotPasswordCode(email: string) {
    if (env.isMock || !supabase) {
      useAppStore.getState().setPendingVerification(email);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      throw mapAuthError(error);
    }

    useAppStore.getState().setPendingVerification(email);
  },

  async verifyCode(email: string, code: string, context: 'signup' | 'forgot' = 'signup') {
    if (env.isMock || !supabase) {
      if (code.length !== 6) {
        throw new Error('Enter a 6 digit code.');
      }
      return true;
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: context === 'signup' ? 'signup' : 'email',
    });

    if (error) {
      throw error;
    }

    return true;
  },

  async resetPassword(password: string) {
    if (env.isMock || !supabase) {
      return true;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw error;
    }

    return true;
  },

  async restoreSession() {
    if (env.isMock || !supabase) {
      useAppStore.getState().setHydrated();
      return null;
    }

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      useAppStore.getState().clearSession();
      useAppStore.getState().setHydrated();
      return null;
    }

    const profile = await fetchProfile(data.user.id);
    const sessionUser = mapSessionUser(data.user, data.user.email ?? undefined, profile);
    useAppStore.getState().hydrateLiveSession(sessionUser, profile);
    useAppStore.getState().setHydrated();
    return sessionUser;
  },

  async logout() {
    if (!env.isMock && supabase) {
      await supabase.auth.signOut();
    }

    useAppStore.getState().clearSession();
  },
};
