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

    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
      throw error;
    }

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { headers: corsHeaders, status: 400 },
    );
  }
});
