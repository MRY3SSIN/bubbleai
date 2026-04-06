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

export const extractResponseText = (response: Record<string, unknown>) => {
  if (typeof response.output_text === 'string' && response.output_text.trim().length > 0) {
    return response.output_text.trim();
  }

  const output = Array.isArray(response.output) ? response.output : [];
  const chunks = output.flatMap((item) => {
    const content =
      item && typeof item === 'object' && Array.isArray((item as { content?: unknown[] }).content)
        ? ((item as { content: Array<Record<string, unknown>> }).content ?? [])
        : [];

    return content
      .map((part) => {
        if (typeof part.text === 'string') {
          return part.text;
        }

        const nestedText = part?.text;
        if (nestedText && typeof nestedText === 'object' && typeof nestedText.value === 'string') {
          return nestedText.value;
        }

        return '';
      })
      .filter(Boolean);
  });

  return chunks.join('\n\n').trim();
};

export const createTranscription = async (audioFile: File) => {
  const formData = new FormData();
  formData.append('model', serverEnv.openAiTranscriptionModel);
  formData.append('file', audioFile, audioFile.name || 'voice-note.m4a');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serverEnv.openAiApiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription request failed: ${await response.text()}`);
  }

  return response.json();
};
