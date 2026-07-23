import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api/auth';
import { apiError } from '@/lib/api/response';
import { budgetProgress, fundProjection, getMonthRange, monthTotals } from '@/lib/derive';
import { fmtRupiah, todayISODateJakarta } from '@/lib/format';
import type { AccountBalance, Budget, Category, FundBalance, Transaction } from '@/lib/types';

/**
 * Month summary for widgets and notifications. Deliberately derived with the same helpers as
 * app/(app)/dashboard/page.tsx, so the numbers here can never drift from what the web shows.
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  const params = new URL(request.url).searchParams;
  const [todayYear, todayMonth] = todayISODateJakarta().split('-').map(Number);
  const year = params.has('year') ? Number(params.get('year')) : todayYear;
  // `month` is 1-12 over the wire — month0 is an internal detail nobody should have to know.
  const month = params.has('month') ? Number(params.get('month')) : todayMonth;

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return apiError('invalid_body', '"year" must be a year and "month" must be 1-12');
  }

  const month0 = month - 1;
  const { start, end } = getMonthRange(year, month0);

  const [txRes, accBalRes, fundBalRes, catRes, budgetRes] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', userId).gte('tanggal', start).lte('tanggal', end),
    supabase.from('account_balances').select('*').eq('user_id', userId),
    supabase.from('fund_balances').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('categories').select('*').eq('user_id', userId).eq('kind', 'expense'),
    supabase.from('budgets').select('*').eq('user_id', userId),
  ]);

  const error = txRes.error ?? accBalRes.error ?? catRes.error ?? budgetRes.error;
  if (error) return apiError('server_error', error.message);

  const monthTx = (txRes.data ?? []) as Transaction[];
  const accountBalances = (accBalRes.data ?? []) as AccountBalance[];
  const fund = fundBalRes.data as FundBalance | null;
  const expenseCategories = (catRes.data ?? []) as Category[];
  const budgets = (budgetRes.data ?? []) as Budget[];

  const { income, expense } = monthTotals(monthTx);
  const budgetRows = budgetProgress(expenseCategories, budgets, monthTx);
  const projection = fund
    ? fundProjection(fund.current_balance, fund.target_amount, fund.monthly_deposit)
    : null;

  const monthLabel = new Date(year, month0, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return NextResponse.json({
    ok: true,
    month: `${year}-${String(month).padStart(2, '0')}`,
    income,
    expense,
    net: income - expense,
    transactionCount: monthTx.length,
    accounts: accountBalances.map((a) => ({ name: a.name, balance: a.balance })),
    budgets: budgetRows.map((r) => ({
      kategori: r.kategori,
      actual: r.actual,
      target: r.target,
      pct: r.pct,
      over: r.over,
      isRecurring: r.isRecurring,
    })),
    fund:
      fund && projection
        ? {
            current: fund.current_balance,
            target: fund.target_amount,
            pct: projection.pct,
            left: projection.left,
            monthsLeft: projection.monthsLeft,
            etaLabel: projection.etaLabel,
          }
        : null,
    // Ready-made line for a Shortcuts notification, so the client needn't format currency.
    text: `${monthLabel} — masuk ${fmtRupiah(income)}, keluar ${fmtRupiah(expense)}, sisa ${fmtRupiah(income - expense)}`,
  });
}
