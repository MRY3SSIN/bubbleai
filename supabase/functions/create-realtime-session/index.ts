import { corsHeaders } from '../_shared/cors.ts';
import { assertServerEnv, serverEnv } from '../_shared/env.ts';
import { createRealtimeSession } from '../_shared/openai.ts';
import { bubbleSystemPrompt, bubbleSafetyDeveloperPrompt } from '../_shared/prompts.ts';
import { getUserFromRequest } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    assertServerEnv();
    const user = await getUserFromRequest(request);
    const { preferredVoice = 'neutral_calm' } = await request.json().catch(() => ({}));

    const realtime = await createRealtimeSession({
      model: serverEnv.openAiRealtimeModel,
      voice: preferredVoice,
      instructions: `${bubbleSystemPrompt}\n${bubbleSafetyDeveloperPrompt}`,
      metadata: {
        user_id: user.id,
      },
    });

    return Response.json(realtime, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { headers: corsHeaders, status: 400 },
    );
  }
});

