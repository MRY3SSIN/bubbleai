import Constants from 'expo-constants';

import type { AppEnvironment } from '@/src/types/domain';

type ExtraConfig = {
  expoConfig?: {
    extra?: {
      eas?: { projectId?: string };
    };
  };
};

const appEnv = (process.env.EXPO_PUBLIC_APP_ENV ?? 'mock') as AppEnvironment;

export const env = {
  appEnv,
  isMock: appEnv === 'mock',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  enableAppleAuth: process.env.EXPO_PUBLIC_ENABLE_APPLE_AUTH === 'true',
  enableGoogleAuth: process.env.EXPO_PUBLIC_ENABLE_GOOGLE_AUTH === 'true',
  enablePhoneAuth: process.env.EXPO_PUBLIC_ENABLE_PHONE_AUTH === 'true',
  projectId: ((Constants as unknown as ExtraConfig).expoConfig?.extra?.eas?.projectId ?? ''),
};

