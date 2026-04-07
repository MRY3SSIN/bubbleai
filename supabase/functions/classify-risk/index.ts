import { corsHeaders } from '../_shared/cors.ts';
import { assertServerEnv, serverEnv } from '../_shared/env.ts';
import { createResponse } from '../_shared/openai.ts';
import { bubbleSafetyDeveloperPrompt } from '../_shared/prompts.ts';
import { detectRiskLevel, fallbackSafetyResponse } from '../_shared/safety.ts';
import { getUserFromRequest } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    assertServerEnv();
    await getUserFromRequest(request);
    const { content } = await request.json();
    const heuristicRisk = detectRiskLevel(content);

    const response = await createResponse({
      model: serverEnv.openAiTextModel,
      instructions: bubbleSafetyDeveloperPrompt,
      input: `Classify the risk of this content:\n${content}`,
      text: {
        format: {
          type: 'json_schema',
          name: 'risk_classification',
          schema: {
            type: 'object',
            properties: {
              risk_level: { type: 'string', enum: ['green', 'yellow', 'red'] },
              confidence: { type: 'number' },
              rationale: { type: 'string' },
            },
            required: ['risk_level', 'confidence', 'rationale'],
            additionalProperties: false,
          },
        },
      },
    });

    const output = JSON.parse(response.output_text ?? '{}');
    const riskLevel = heuristicRisk === 'red' ? 'red' : output.risk_level ?? heuristicRisk;

    return Response.json(
      {
        risk_level: riskLevel,
        confidence: output.confidence ?? 0.5,
        rationale: output.rationale ?? fallbackSafetyResponse(riskLevel),
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
