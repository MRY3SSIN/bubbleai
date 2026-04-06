export const serverEnv = {
  openAiApiKey: Deno.env.get('OPENAI_API_KEY') ?? '',
  openAiTextModel: Deno.env.get('OPENAI_TEXT_MODEL') ?? 'gpt-5.4-mini',
  openAiRealtimeModel: Deno.env.get('OPENAI_REALTIME_MODEL') ?? 'gpt-4o-realtime-preview',
  openAiModerationModel: Deno.env.get('OPENAI_MODERATION_MODEL') ?? 'omni-moderation-latest',
  openAiTranscriptionModel: Deno.env.get('OPENAI_TRANSCRIPTION_MODEL') ?? 'gpt-4o-mini-transcribe',
  supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
  supabaseServiceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
};

export const assertServerEnv = () => {
  const missing = Object.entries(serverEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing server env: ${missing.join(', ')}`);
  }
};
