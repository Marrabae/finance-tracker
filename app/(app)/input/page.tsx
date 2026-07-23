import { createClient, getAuthedUser } from '@/lib/supabase/server';
import { TransactionForm, type EditingTransaction } from '@/components/input/TransactionForm';
import type { Category, Transaction } from '@/lib/types';

export default async function InputPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const user = await getAuthedUser();
  const userId = user!.id;

  const [accRes, catRes, editRes] = await Promise.all([
    supabase.from('accounts').select('id, name').eq('user_id', userId).order('created_at'),
    supabase.from('categories').select('*').eq('user_id', userId).order('created_at'),
    sp.edit
      ? supabase.from('transactions').select('*').eq('user_id', userId).eq('id', sp.edit).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const categories = (catRes.data ?? []) as Category[];
  const expenseCategories = categories.filter((c) => c.kind === 'expense').map((c) => ({ id: c.id, name: c.name }));
  const incomeCategories = categories.filter((c) => c.kind === 'income').map((c) => ({ id: c.id, name: c.name }));
  const accounts = accRes.data ?? [];

  const editTx = editRes.data as Transaction | null;
  const editing: EditingTransaction | null = editTx
    ? {
        id: editTx.id,
        tanggal: editTx.tanggal,
        tipe: editTx.tipe,
        categoryId: editTx.category_id,
        accountId: editTx.account_id,
        accountToId: editTx.account_to_id,
        jumlah: editTx.jumlah,
        catatan: editTx.catatan ?? '',
      }
    : null;

  return (
    <TransactionForm
      accounts={accounts}
      expenseCategories={expenseCategories}
      incomeCategories={incomeCategories}
      editing={editing}
    />
  );
}
