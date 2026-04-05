import { corsHeaders } from '../_shared/cors.ts';
import { assertServerEnv } from '../_shared/env.ts';
import { createModeration } from '../_shared/openai.ts';
import { getUserFromRequest } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    assertServerEnv();
    await getUserFromRequest(request);
    const { input } = await request.json();
    const moderation = await createModeration(input);
    return Response.json(moderation, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { headers: corsHeaders, status: 400 },
    );
  }
});
