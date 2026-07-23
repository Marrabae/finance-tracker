import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. **Bypasses Row Level Security** — every query made with it
 * must be scoped manually with `.eq('user_id', userId)`.
 *
 * Only import this from `app/api/**` route handlers, where the caller is identified by an
 * API token instead of a Supabase session (so `auth.uid()` is null and RLS can't apply).
 * Never import it from a Server Component, Server Action, or anything reaching the browser.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
