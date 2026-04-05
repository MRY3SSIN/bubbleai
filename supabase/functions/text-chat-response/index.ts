import { corsHeaders } from '../_shared/cors.ts';
import { assertServerEnv, serverEnv } from '../_shared/env.ts';
import { createModeration, createResponse } from '../_shared/openai.ts';
import { bubbleSafetyDeveloperPrompt, bubbleSystemPrompt } from '../_shared/prompts.ts';
import { createServiceClient, getUserFromRequest } from '../_shared/supabase.ts';
import { detectRiskLevel, fallbackSafetyResponse } from '../_shared/safety.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    assertServerEnv();
    const user = await getUserFromRequest(request);
    const supabase = createServiceClient();
    const { sessionId, message, mode = 'text' } = await request.json();

    const moderation = await createModeration(message);
    const heuristicRisk = detectRiskLevel(message);

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    const { data: recentCheckins } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    const { data: recentJournals } = await supabase
      .from('journal_entries')
      .select('title, summary, risk_level')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    const { data: priorMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(16);

    const safetyOverride = heuristicRisk === 'red' || heuristicRisk === 'yellow';

    const aiResponse = safetyOverride
      ? { output_text: fallbackSafetyResponse(heuristicRisk) }
      : await createResponse({
          model: serverEnv.openAiTextModel,
          input: [
            {
              role: 'system',
              content: [{ type: 'input_text', text: bubbleSystemPrompt }],
            },
            {
              role: 'system',
              content: [{ type: 'input_text', text: bubbleSafetyDeveloperPrompt }],
            },
            {
              role: 'system',
              content: [
                {
                  type: 'input_text',
                  text: `Profile context: ${JSON.stringify(profile ?? {})}\nRecent check-ins: ${JSON.stringify(recentCheckins ?? [])}\nRecent journals: ${JSON.stringify(recentJournals ?? [])}\nMode: ${mode}`,
                },
              ],
            },
            ...(priorMessages ?? []).map((item) => ({
              role: item.role,
              content: [{ type: 'input_text', text: item.content }],
            })),
            {
              role: 'user',
              content: [{ type: 'input_text', text: message }],
            },
          ],
        });

    const assistantText = aiResponse.output_text ?? fallbackSafetyResponse(heuristicRisk);

    await supabase.from('chat_messages').insert([
      {
        session_id: sessionId,
        user_id: user.id,
        role: 'user',
        content: message,
        moderation,
        risk_level: heuristicRisk,
      },
      {
        session_id: sessionId,
        user_id: user.id,
        role: 'assistant',
        content: assistantText,
        moderation: {},
        risk_level: heuristicRisk,
      },
    ]);

    await supabase
      .from('chat_sessions')
      .update({
        last_message_at: new Date().toISOString(),
        risk_state: heuristicRisk,
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    return Response.json(
      {
        risk_level: heuristicRisk,
        assistant_text: assistantText,
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

