'use server';

import { revalidatePath } from 'next/cache';
import { createClient, authedUserId } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

export async function updateBudgetTarget(categoryId: string, amount: number): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await authedUserId(supabase);
  if (!userId) return { ok: false, message: 'Not signed in' };

  const { error } = await supabase
    .from('budgets')
    .upsert(
      { user_id: userId, category_id: categoryId, target_amount: amount },
      { onConflict: 'user_id,category_id' }
    );
  if (error) return { ok: false, message: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/settings');
  return { ok: true, message: 'Saved' };
}
