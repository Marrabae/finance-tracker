import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api/auth';
import { apiError } from '@/lib/api/response';
import type { Account, AccountBalance, Category } from '@/lib/types';

/**
 * Everything a client needs to build its pickers in one round-trip — iOS Shortcuts pays a
 * noticeable cost per request, so accounts and categories are deliberately not split up.
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  const [accRes, balRes, catRes] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('account_balances').select('*').eq('user_id', userId),
    supabase.from('categories').select('*').eq('user_id', userId).order('created_at'),
  ]);

  const error = accRes.error ?? balRes.error ?? catRes.error;
  if (error) return apiError('server_error', error.message);

  const accounts = (accRes.data ?? []) as Account[];
  const categories = (catRes.data ?? []) as Category[];
  const balanceByAccount = new Map(
    ((balRes.data ?? []) as AccountBalance[]).map((b) => [b.account_id, b.balance])
  );

  return NextResponse.json({
    ok: true,
    accounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      balance: balanceByAccount.get(a.id) ?? a.starting_balance,
    })),
    categories: {
      expense: categories
        .filter((c) => c.kind === 'expense')
        .map((c) => ({ id: c.id, name: c.name, is_recurring: c.is_recurring })),
      income: categories.filter((c) => c.kind === 'income').map((c) => ({ id: c.id, name: c.name })),
    },
  });
}
