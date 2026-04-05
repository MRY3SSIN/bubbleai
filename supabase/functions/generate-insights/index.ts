import { corsHeaders } from '../_shared/cors.ts';
import { assertServerEnv } from '../_shared/env.ts';
import { createServiceClient, getUserFromRequest } from '../_shared/supabase.ts';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    assertServerEnv();
    const user = await getUserFromRequest(request);
    const supabase = createServiceClient();
    const { period = 'week' } = await request.json().catch(() => ({ period: 'week' }));

    const { data: checkins } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(14);
    const { data: journals } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(14);

    const safeCheckins = checkins ?? [];
    const averageMood = safeCheckins.length
      ? safeCheckins.reduce((sum, item) => sum + item.mood, 0) / safeCheckins.length
      : 0;
    const averageStress = safeCheckins.length
      ? safeCheckins.reduce((sum, item) => sum + item.stress, 0) / safeCheckins.length
      : 0;
    const averageSleep = safeCheckins.length
      ? safeCheckins.reduce((sum, item) => sum + Number(item.sleep_hours), 0) / safeCheckins.length
      : 0;

    const bubbleScore = {
      mood: Math.round(clamp((averageMood / 5) * 80, 0, 80)),
      stress: Math.round(clamp(((10 - averageStress) / 10) * 80, 0, 80)),
      sleep: Math.round(clamp((averageSleep / 8) * 60, 0, 60)),
      consistency: Math.round(clamp((safeCheckins.length / 14) * 40, 0, 40)),
      reflection: Math.round(clamp(((journals ?? []).length / 7) * 40, 0, 40)),
    };

    const total =
      bubbleScore.mood +
      bubbleScore.stress +
      bubbleScore.sleep +
      bubbleScore.consistency +
      bubbleScore.reflection;

    return Response.json(
      {
        period,
        bubble_score: {
          total,
          ...bubbleScore,
          explanation:
            'Bubble Score blends mood, stress, sleep, and how consistently the user is checking in or journaling.',
        },
        insights: [
          'Stress looks lower when routines are simpler and evenings are quieter.',
          'Check-ins are happening consistently, which helps BubbleAI personalize support safely.',
        ],
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

