'use server';

import { revalidatePath } from 'next/cache';
import { createClient, authedUserId } from '@/lib/supabase/server';
import type { ActionResult, CategoryKind } from '@/lib/types';

/** `%` and `_` are wildcards in ilike — a category literally named "50_50" should still match itself. */
function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

function revalidateAll() {
  revalidatePath('/dashboard');
  revalidatePath('/input');
  revalidatePath('/history');
  revalidatePath('/settings');
}

export async function addCategory(kind: CategoryKind, name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: 'Enter a name' };

  const supabase = await createClient();
  const userId = await authedUserId(supabase);
  if (!userId) return { ok: false, message: 'Not signed in' };

  // Names only have to be unique within a kind — an income "Bonus" and an expense
  // "Bonus" can coexist.
  const { data: existing } = await supabase
    .from('categories')
    .select('name')
    .eq('user_id', userId)
    .eq('kind', kind)
    .ilike('name', escapeLike(trimmed))
    .limit(1);
  const clash = existing?.[0];
  if (clash) {
    return { ok: false, message: `"${clash.name}" already exists as an ${kind} category` };
  }

  const { data: inserted, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, kind, name: trimmed })
    .select('id')
    .single();
  if (error?.code === '23505') return { ok: false, message: `"${trimmed}" already exists` };
  if (error || !inserted) return { ok: false, message: error?.message ?? 'Could not add category' };

  if (kind === 'expense') {
    await supabase.from('budgets').insert({ user_id: userId, category_id: inserted.id, target_amount: 0 });
  }

  revalidateAll();
  return { ok: true, message: `Category "${trimmed}" added` };
}

export async function setCategoryRecurring(id: string, isRecurring: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await authedUserId(supabase);
  if (!userId) return { ok: false, message: 'Not signed in' };

  const { error } = await supabase
    .from('categories')
    .update({ is_recurring: isRecurring })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Saved' };
}

export async function removeCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await authedUserId(supabase);
  if (!userId) return { ok: false, message: 'Not signed in' };

  const { count: txCount } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('category_id', id);
  if ((txCount ?? 0) > 0) return { ok: false, message: 'Category has transactions — move or delete them first' };

  const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', userId);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Category removed' };
}
