import { createClient, getAuthedUser } from '@/lib/supabase/server';
import { getMonthRange, monthTotals, budgetProgress } from '@/lib/derive';
import { MonthSwitcher } from '@/components/dashboard/MonthSwitcher';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { AccountBalanceGrid } from '@/components/dashboard/AccountBalanceGrid';
import { BudgetProgressList } from '@/components/dashboard/BudgetProgressList';
import type { AccountBalance, Budget, Category, FundBalance, Transaction } from '@/lib/types';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? Number(sp.year) : now.getFullYear();
  const month0 = sp.month ? Number(sp.month) : now.getMonth();

  const supabase = await createClient();
  const user = await getAuthedUser();
  const userId = user!.id;
  const { start, end } = getMonthRange(year, month0);

  const [txRes, accBalRes, fundBalRes, catRes, budgetRes] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', userId).gte('tanggal', start).lte('tanggal', end),
    supabase.from('account_balances').select('*').eq('user_id', userId),
    supabase.from('fund_balances').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('categories').select('*').eq('user_id', userId).eq('kind', 'expense'),
    supabase.from('budgets').select('*').eq('user_id', userId),
  ]);

  const monthTx = (txRes.data ?? []) as Transaction[];
  const accountBalances = (accBalRes.data ?? []) as AccountBalance[];
  const fundBalance = fundBalRes.data as FundBalance | null;
  const expenseCategories = (catRes.data ?? []) as Category[];
  const budgets = (budgetRes.data ?? []) as Budget[];

  const { income, expense } = monthTotals(monthTx);
  const rows = budgetProgress(expenseCategories, budgets, monthTx);

  const accountRows: { name: string; balance: number; emphasized?: boolean }[] =
    accountBalances.map((a) => ({ name: a.name, balance: a.balance }));
  if (fundBalance) accountRows.push({ name: 'Dana Darurat', balance: fundBalance.current_balance, emphasized: true });

  return (
    <>
      <MonthSwitcher year={year} month0={month0} />
      <SummaryCards income={income} expense={expense} />
      <AccountBalanceGrid rows={accountRows} />
      <BudgetProgressList rows={rows} monthHasTx={monthTx.length > 0} />
    </>
  );
}
