'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult, CategoryKind } from '@/lib/types';

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not signed in' };

  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', trimmed);
  if (existing && existing.length > 0) return { ok: false, message: 'Category already exists' };

  const { data: inserted, error } = await supabase
    .from('categories')
    .insert({ user_id: user.id, kind, name: trimmed })
    .select('id')
    .single();
  if (error || !inserted) return { ok: false, message: error?.message ?? 'Could not add category' };

  if (kind === 'expense') {
    await supabase.from('budgets').insert({ user_id: user.id, category_id: inserted.id, target_amount: 0 });
  }

  revalidateAll();
  return { ok: true, message: `Category "${trimmed}" added` };
}

export async function setCategoryRecurring(id: string, isRecurring: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not signed in' };

  const { error } = await supabase
    .from('categories')
    .update({ is_recurring: isRecurring })
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Saved' };
}

export async function removeCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not signed in' };

  const { count: txCount } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('category_id', id);
  if ((txCount ?? 0) > 0) return { ok: false, message: 'Category has transactions — move or delete them first' };

  const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Category removed' };
}
