import { corsHeaders } from '../_shared/cors.ts';
import {
  buildAssistantInstructions,
  formatConversationHistory,
  loadConversationContext,
} from '../_shared/chat-context.ts';
import { assertServerEnv, serverEnv } from '../_shared/env.ts';
import {
  createModeration,
  createResponse,
  createTranscription,
  extractResponseText,
} from '../_shared/openai.ts';
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
    const formData = await request.formData();
    const sessionId = String(formData.get('sessionId') ?? '');
    const audio = formData.get('audio');
    const clientContextRaw = String(formData.get('clientContext') ?? '');
    const clientContext = clientContextRaw ? JSON.parse(clientContextRaw) : null;

    if (!(audio instanceof File)) {
      throw new Error('No audio file was sent.');
    }

    if (!sessionId) {
      throw new Error('Missing conversation session.');
    }

    const transcription = await createTranscription(audio);
    const transcript = typeof transcription.text === 'string' ? transcription.text.trim() : '';

    if (!transcript) {
      throw new Error('BubbleAI could not hear that clearly enough yet.');
    }

    const moderation = await createModeration(transcript);
    const heuristicRisk = detectRiskLevel(transcript);
    const context = await loadConversationContext(supabase, user.id, sessionId);

    const safetyOverride = heuristicRisk === 'red' || heuristicRisk === 'yellow';

    const aiResponse = safetyOverride
      ? { output_text: fallbackSafetyResponse(heuristicRisk, transcript) }
      : await createResponse({
          model: serverEnv.openAiTextModel,
          temperature: 0.8,
          instructions: buildAssistantInstructions({
            mode: 'voice',
            clientContext,
            context,
            systemPrompt: bubbleSystemPrompt,
            safetyPrompt: bubbleSafetyDeveloperPrompt,
          }),
          input:
            `Conversation so far:\n${formatConversationHistory(context.priorMessages)}\n\n` +
            `Latest voice transcript:\n${transcript}\n\n` +
            'Reply as BubbleAI in plain text only. Keep it especially easy to hear out loud.',
        });

    const assistantText = extractResponseText(aiResponse) || fallbackSafetyResponse(heuristicRisk, transcript);

    await supabase.from('chat_messages').insert([
      {
        session_id: sessionId,
        user_id: user.id,
        role: 'user',
        content: transcript,
        moderation,
        risk_level: heuristicRisk,
        metadata: { source: 'voice', audio_name: audio.name },
      },
      {
        session_id: sessionId,
        user_id: user.id,
        role: 'assistant',
        content: assistantText,
        moderation: {},
        risk_level: heuristicRisk,
        response_id: typeof aiResponse.id === 'string' ? aiResponse.id : null,
        metadata: { source: 'voice' },
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
        transcript,
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
