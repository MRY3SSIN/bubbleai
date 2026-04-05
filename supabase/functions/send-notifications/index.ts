import { corsHeaders } from '../_shared/cors.ts';
import { assertServerEnv } from '../_shared/env.ts';
import { createServiceClient, getUserFromRequest } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    assertServerEnv();
    const user = await getUserFromRequest(request);
    const supabase = createServiceClient();
    const { type = 'daily_checkin' } = await request.json().catch(() => ({ type: 'daily_checkin' }));

    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return Response.json(
      {
        ok: true,
        scheduled: Boolean(settings?.enabled),
        type,
        message:
          'This Edge Function is ready to fan out reminder payloads or Expo push requests once push tokens are stored.',
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { headers: corsHeaders, status: 400 },
    );
  }
});

