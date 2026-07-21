export type CategoryKind = 'expense' | 'income';
export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  starting_balance: number;
  created_at: string;
}

export interface AccountBalance {
  account_id: string;
  user_id: string;
  name: string;
  starting_balance: number;
  balance: number;
}

export interface Category {
  id: string;
  user_id: string;
  kind: CategoryKind;
  name: string;
  is_recurring: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  target_amount: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  tanggal: string;
  tipe: TransactionType;
  category_id: string | null;
  account_id: string;
  account_to_id: string | null;
  jumlah: number;
  catatan: string | null;
  created_at: string;
}

export interface FundSettings {
  user_id: string;
  target_amount: number;
  starting_balance: number;
  monthly_deposit: number;
  updated_at: string;
}

export interface FundBalance {
  user_id: string;
  target_amount: number;
  starting_balance: number;
  monthly_deposit: number;
  current_balance: number;
  deposited_total: number;
}

/** Shape returned by an actions/* mutation, consumed by the calling client component for a toast. */
export interface ActionResult {
  ok: boolean;
  message: string;
}
