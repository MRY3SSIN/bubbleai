import { serverEnv } from './env.ts';

const baseHeaders = () => ({
  Authorization: `Bearer ${serverEnv.openAiApiKey}`,
  'Content-Type': 'application/json',
});

export const createModeration = async (input: string) => {
  const response = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify({
      model: serverEnv.openAiModerationModel,
      input,
    }),
  });

  if (!response.ok) {
    throw new Error(`Moderation request failed: ${await response.text()}`);
  }

  return response.json();
};

export const createRealtimeSession = async (payload: Record<string, unknown>) => {
  const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Realtime session request failed: ${await response.text()}`);
  }

  return response.json();
};

export const createResponse = async (payload: Record<string, unknown>) => {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Responses request failed: ${await response.text()}`);
  }

  return response.json();
};

