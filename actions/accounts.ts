'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

function revalidateAll() {
  revalidatePath('/dashboard');
  revalidatePath('/input');
  revalidatePath('/history');
  revalidatePath('/settings');
}

export async function createAccount(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: 'Enter a name' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not signed in' };

  const { data: existing } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', trimmed);
  if (existing && existing.length > 0) return { ok: false, message: 'Account already exists' };

  const { error } = await supabase.from('accounts').insert({ user_id: user.id, name: trimmed, starting_balance: 0 });
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: `Account "${trimmed}" added` };
}

export async function updateAccount(id: string, patch: { name?: string; starting_balance?: number }): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not signed in' };

  const { error } = await supabase.from('accounts').update(patch).eq('id', id).eq('user_id', user.id);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Saved' };
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not signed in' };

  const { count: accountCount } = await supabase
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if ((accountCount ?? 0) <= 1) return { ok: false, message: 'Keep at least one account' };

  const { count: txCount } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .or(`account_id.eq.${id},account_to_id.eq.${id}`);
  if ((txCount ?? 0) > 0) return { ok: false, message: 'Account has transactions — move or delete them first' };

  const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Account removed' };
}
