'use server';

import { revalidatePath } from 'next/cache';
import { createClient, authedUserId } from '@/lib/supabase/server';
import {
  buildTransactionRow,
  transactionSavedMessage,
  validateTransactionInput,
  type TransactionInput,
} from '@/lib/transactions';
import type { ActionResult } from '@/lib/types';

function revalidateAll() {
  revalidatePath('/dashboard');
  revalidatePath('/history');
  revalidatePath('/fund');
}

export async function createTransaction(input: TransactionInput): Promise<ActionResult> {
  const err = validateTransactionInput(input);
  if (err) return { ok: false, message: err };

  const supabase = await createClient();
  const userId = await authedUserId(supabase);
  if (!userId) return { ok: false, message: 'Not signed in' };

  const { error } = await supabase
    .from('transactions')
    .insert({ user_id: userId, ...buildTransactionRow(input) });
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: transactionSavedMessage(input) };
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<ActionResult> {
  const err = validateTransactionInput(input);
  if (err) return { ok: false, message: err };

  const supabase = await createClient();
  const userId = await authedUserId(supabase);
  if (!userId) return { ok: false, message: 'Not signed in' };

  const { error } = await supabase
    .from('transactions')
    .update(buildTransactionRow(input))
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Transaction updated' };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const userId = await authedUserId(supabase);
  if (!userId) return { ok: false, message: 'Not signed in' };

  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Transaction deleted' };
}
