import { createClient } from '@/lib/supabase/server';
import { fmtRupiah } from '@/lib/format';
import { HistoryFilters } from '@/components/history/HistoryFilters';
import { TransactionGroupList, type HistoryGroup } from '@/components/history/TransactionGroupList';
import type { Account, Category, Transaction, TransactionType } from '@/lib/types';

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string; account?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id;

  let query = supabase.from('transactions').select('*').eq('user_id', userId).order('tanggal', { ascending: false });
  if (sp.type && sp.type !== 'all') query = query.eq('tipe', sp.type as TransactionType);
  if (sp.category && sp.category !== 'all') query = query.eq('category_id', sp.category);
  if (sp.account && sp.account !== 'all') query = query.or(`account_id.eq.${sp.account},account_to_id.eq.${sp.account}`);
  if (sp.from) query = query.gte('tanggal', sp.from);
  if (sp.to) query = query.lte('tanggal', sp.to);

  const [txRes, catRes, accRes] = await Promise.all([
    query,
    supabase.from('categories').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('accounts').select('*').eq('user_id', userId).order('created_at'),
  ]);

  const transactions = (txRes.data ?? []) as Transaction[];
  const categories = (catRes.data ?? []) as Category[];
  const accounts = (accRes.data ?? []) as Account[];
  const categoryById = new Map(categories.map((c) => [c.id, c.name]));
  const accountById = new Map(accounts.map((a) => [a.id, a.name]));

  const categoryOptions = [
    { value: 'all', label: 'All categories' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];
  const accountOptions = [
    { value: 'all', label: 'All accounts' },
    ...accounts.map((a) => ({ value: a.id, label: a.name })),
  ];

  const groupsMap = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (!groupsMap.has(t.tanggal)) groupsMap.set(t.tanggal, []);
    groupsMap.get(t.tanggal)!.push(t);
  }

  const groups: HistoryGroup[] = [...groupsMap.entries()].map(([date, items]) => ({
    date,
    items: items.map((t) => {
      const kategori = t.tipe === 'transfer' ? 'Transfer' : (t.category_id ? categoryById.get(t.category_id) ?? '?' : '?');
      const sub =
        (t.catatan ? t.catatan + ' · ' : '') +
        (t.tipe === 'transfer'
          ? `${accountById.get(t.account_id) ?? '?'} → ${accountById.get(t.account_to_id ?? '') ?? '?'}`
          : accountById.get(t.account_id) ?? '?');
      const amountFmt = (t.tipe === 'income' ? '+' : t.tipe === 'transfer' ? '' : '−') + fmtRupiah(t.jumlah);
      const amtColor = t.tipe === 'income' ? '#0f6b4f' : t.tipe === 'transfer' ? '#6b7671' : '#111814';
      return { id: t.id, kategori, sub, amountFmt, amtColor };
    }),
  }));

  return (
    <>
      <HistoryFilters categoryOptions={categoryOptions} accountOptions={accountOptions} count={transactions.length} />
      <TransactionGroupList groups={groups} />
    </>
  );
}
