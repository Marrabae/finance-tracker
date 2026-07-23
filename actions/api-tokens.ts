'use server';

import { revalidatePath } from 'next/cache';
import { generateApiToken } from '@/lib/api/token';
import { createClient, authedUserId } from '@/lib/supabase/server';
import type { ActionResult, ApiTokenResult } from '@/lib/types';

export async function createApiToken(name: string): Promise<ApiTokenResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: 'Give the token a name' };

  const supabase = await createClient();
  const userId = await authedUserId(supabase);
  if (!userId) return { ok: false, message: 'Not signed in' };

  const { token, hash, prefix } = generateApiToken();
  const { error } = await supabase
    .from('api_tokens')
    .insert({ user_id: userId, name: trimmed, token_hash: hash, token_prefix: prefix });

  if (error) return { ok: false, message: error.message };

  revalidatePath('/settings');
  // The only time the plaintext leaves the server — the DB holds nothing but its hash.
  return { ok: true, message: `Token "${trimmed}" created`, token };
}

export async function revokeApiToken(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await authedUserId(supabase);
  if (!userId) return { ok: false, message: 'Not signed in' };

  const { error } = await supabase.from('api_tokens').delete().eq('id', id).eq('user_id', userId);
  if (error) return { ok: false, message: error.message };

  revalidatePath('/settings');
  return { ok: true, message: 'Token revoked' };
}
