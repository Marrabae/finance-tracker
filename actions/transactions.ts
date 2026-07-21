'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult, TransactionType } from '@/lib/types';

export interface TransactionInput {
  tanggal: string;
  tipe: TransactionType;
  categoryId: string | null;
  accountId: string;
  accountToId: string | null;
  jumlah: number;
  catatan: string;
}

function validate(input: TransactionInput): string | null {
  const isTrf = input.tipe === 'transfer';
  if (!input.jumlah || input.jumlah <= 0) return 'Enter an amount';
  if (!isTrf && !input.categoryId) return 'Pick a category';
  if (!input.accountId) return isTrf ? 'Pick a source account' : 'Pick an account';
  if (isTrf && !input.accountToId) return 'Pick a destination account';
  if (isTrf && input.accountId === input.accountToId) return 'Source and destination must differ';
  return null;
}

function revalidateAll() {
  revalidatePath('/dashboard');
  revalidatePath('/history');
  revalidatePath('/fund');
}

export async function createTransaction(input: TransactionInput): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { ok: false, message: err };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not signed in' };

  const isTrf = input.tipe === 'transfer';
  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    tanggal: input.tanggal,
    tipe: input.tipe,
    category_id: isTrf ? null : input.categoryId,
    account_id: input.accountId,
    account_to_id: isTrf ? input.accountToId : null,
    jumlah: input.jumlah,
    catatan: input.catatan || null,
  });

  if (error) return { ok: false, message: error.message };

  revalidateAll();
  const kind = isTrf ? 'Transfer' : input.tipe === 'income' ? 'Income' : 'Expense';
  return { ok: true, message: `${kind} of Rp${input.jumlah.toLocaleString('id-ID')} saved` };
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { ok: false, message: err };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not signed in' };

  const isTrf = input.tipe === 'transfer';
  const { error } = await supabase
    .from('transactions')
    .update({
      tanggal: input.tanggal,
      tipe: input.tipe,
      category_id: isTrf ? null : input.categoryId,
      account_id: input.accountId,
      account_to_id: isTrf ? input.accountToId : null,
      jumlah: input.jumlah,
      catatan: input.catatan || null,
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Transaction updated' };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not signed in' };

  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
  if (error) return { ok: false, message: error.message };

  revalidateAll();
  return { ok: true, message: 'Transaction deleted' };
}
