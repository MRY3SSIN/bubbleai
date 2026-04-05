import { createClient } from 'npm:@supabase/supabase-js@2';

import { serverEnv } from './env.ts';

export const createServiceClient = () =>
  createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

export const getUserFromRequest = async (request: Request) => {
  const authorization = request.headers.get('Authorization') ?? '';
  const token = authorization.replace('Bearer ', '').trim();

  if (!token) {
    throw new Error('Missing bearer token.');
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error('Invalid auth token.');
  }

  return data.user;
};

