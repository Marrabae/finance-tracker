import type { TransactionType } from './types';

export interface TransactionInput {
  tanggal: string;
  tipe: TransactionType;
  categoryId: string | null;
  accountId: string;
  accountToId: string | null;
  jumlah: number;
  catatan: string;
}

/**
 * Shared by the web Server Actions and the /api/v1 route handlers, so both paths enforce the
 * same transfer rules the DB check constraints do (see 0001_init.sql).
 */
export function validateTransactionInput(input: TransactionInput): string | null {
  const isTrf = input.tipe === 'transfer';
  if (!input.jumlah || input.jumlah <= 0) return 'Enter an amount';
  if (!isTrf && !input.categoryId) return 'Pick a category';
  if (!input.accountId) return isTrf ? 'Pick a source account' : 'Pick an account';
  if (isTrf && !input.accountToId) return 'Pick a destination account';
  if (isTrf && input.accountId === input.accountToId) return 'Source and destination must differ';
  return null;
}

/**
 * The writable `transactions` columns — transfers drop the category, everything else drops the
 * destination. `user_id` is left to the caller so the same shape works for insert and update.
 */
export function buildTransactionRow(input: TransactionInput) {
  const isTrf = input.tipe === 'transfer';
  return {
    tanggal: input.tanggal,
    tipe: input.tipe,
    category_id: isTrf ? null : input.categoryId,
    account_id: input.accountId,
    account_to_id: isTrf ? input.accountToId : null,
    jumlah: input.jumlah,
    catatan: input.catatan || null,
  };
}

export function transactionSavedMessage(input: TransactionInput): string {
  const kind = input.tipe === 'transfer' ? 'Transfer' : input.tipe === 'income' ? 'Income' : 'Expense';
  return `${kind} of Rp${input.jumlah.toLocaleString('id-ID')} saved`;
}
