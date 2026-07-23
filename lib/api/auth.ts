import type { SupabaseClient } from '@supabase/supabase-js';
import type { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError } from './response';
import { hashApiToken, TOKEN_PREFIX } from './token';

export type AuthedRequest =
  | { ok: true; supabase: SupabaseClient; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Resolve `Authorization: Bearer ft_…` to the owning user.
 *
 * API callers have no Supabase session, so `auth.uid()` is null and RLS can't scope their
 * queries. The token row is therefore the only thing establishing identity: every query the
 * route makes afterwards must filter on the returned `userId` explicitly.
 */
export async function authenticateRequest(request: Request): Promise<AuthedRequest> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!token.startsWith(TOKEN_PREFIX)) {
    return {
      ok: false,
      response: apiError('unauthorized', 'Missing or malformed Authorization header. Expected: Bearer ft_…'),
    };
  }

  let supabase: SupabaseClient;
  try {
    supabase = createAdminClient();
  } catch {
    return { ok: false, response: apiError('server_error', 'API is not configured on the server') };
  }

  const { data: row } = await supabase
    .from('api_tokens')
    .select('id, user_id')
    .eq('token_hash', hashApiToken(token))
    .maybeSingle();

  if (!row) return { ok: false, response: apiError('unauthorized', 'Invalid or revoked token') };

  // Best-effort usage stamp — never let it delay or fail the actual request.
  void supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', row.id)
    .then(() => undefined, () => undefined);

  return { ok: true, supabase, userId: row.user_id as string };
}
