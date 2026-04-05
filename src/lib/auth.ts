import { createClient } from '@supabase/supabase-js';

import { env } from '@/src/lib/env';
import { secureStoreStorage } from '@/src/lib/secure-store';
import { useAppStore } from '@/src/lib/app-store';
import type { SessionUser } from '@/src/types/domain';

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

const createMockUser = (credentials: Credentials): SessionUser => ({
  id: `mock-${credentials.email}`,
  email: credentials.email,
  fullName: credentials.fullName ?? 'BubbleAI User',
  displayName: credentials.fullName?.split(' ')[0] ?? 'Friend',
  onboardingComplete: false,
});

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
      throw error;
    }

    const sessionUser: SessionUser = {
      id: data.user.id,
      email: data.user.email ?? credentials.email,
      fullName: (data.user.user_metadata.full_name as string | undefined) ?? 'BubbleAI User',
      displayName:
        (data.user.user_metadata.display_name as string | undefined) ??
        ((data.user.user_metadata.full_name as string | undefined)?.split(' ')[0] ?? 'Friend'),
      onboardingComplete: Boolean(data.user.user_metadata.onboarding_complete),
    };

    useAppStore.getState().setSession(sessionUser);
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
      throw error;
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
      throw error;
    }

    useAppStore.getState().setPendingVerification(email);
  },

  async verifyCode(email: string, code: string) {
    if (env.isMock || !supabase) {
      if (code.length !== 6) {
        throw new Error('Enter a 6 digit code.');
      }
      return true;
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
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

  async logout() {
    if (!env.isMock && supabase) {
      await supabase.auth.signOut();
    }

    useAppStore.getState().clearSession();
  },
};

