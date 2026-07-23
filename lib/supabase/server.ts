import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cache } from 'react';

/** Server-side Supabase client for use in Server Components and Server Actions. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // setAll called from a Server Component — safe to ignore, middleware refreshes the session.
          }
        },
      },
    }
  );
}

/**
 * Verified auth identity, deduped per request via React cache(). Uses getClaims(),
 * which verifies the access-token JWT locally (no network) when the project uses
 * asymmetric JWT signing keys — falling back to a server call only for legacy
 * symmetric secrets. The JWT signature check makes claims.sub safe to trust for
 * scoping queries (RLS remains the second layer).
 */
export const getAuthedUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub as string, email: claims.email as string | undefined };
});

/** Verified user id from the JWT, or null. Reuses an existing client (for Server Actions). */
export async function authedUserId(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}
