'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

export async function updateFundSettings(patch: {
  target_amount?: number;
  starting_balance?: number;
  monthly_deposit?: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not signed in' };

  const { error } = await supabase
    .from('fund_settings')
    .upsert({ user_id: user.id, ...patch }, { onConflict: 'user_id' });
  if (error) return { ok: false, message: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/fund');
  revalidatePath('/settings');
  return { ok: true, message: 'Saved' };
}
