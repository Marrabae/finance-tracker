import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { authenticateRequest } from '@/lib/api/auth';
import { apiError } from '@/lib/api/response';
import { getMonthRange } from '@/lib/derive';
import { todayISODateJakarta } from '@/lib/format';
import {
  buildTransactionRow,
  transactionSavedMessage,
  validateTransactionInput,
  type TransactionInput,
} from '@/lib/transactions';
import type { Budget, CategoryKind, Transaction, TransactionType } from '@/lib/types';

const TYPES: TransactionType[] = ['expense', 'income', 'transfer'];

interface Body {
  tipe?: string;
  jumlah?: number | string;
  tanggal?: string;
  catatan?: string;
  category?: string;
  categoryId?: string;
  account?: string;
  accountId?: string;
  accountTo?: string;
  accountToId?: string;
}

/** Amounts may arrive as "25.000" or "25000" — Shortcuts text inputs are always strings. */
function parseAmount(value: number | string | undefined): number {
  if (typeof value === 'number') return Math.trunc(value);
  return Number(String(value ?? '').replace(/\D/g, '') || 0);
}

/** `%` and `_` are wildcards in ilike — a category literally named "50_50" should still match itself. */
function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

type Resolved = { id: string; name: string } | { error: NextResponse };

/**
 * Look an account up by name (case-insensitive, exact). Names are far friendlier than UUIDs to
 * hard-code in a Shortcut, and a miss returns the valid names so it can be fixed on the phone.
 */
async function resolveAccount(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  field: string
): Promise<Resolved> {
  const { data } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('user_id', userId)
    .ilike('name', escapeLike(name))
    .maybeSingle();

  if (data) return { id: data.id as string, name: data.name as string };

  const { data: all } = await supabase.from('accounts').select('name').eq('user_id', userId);
  return {
    error: apiError('not_found', `No account named "${name}" (field: ${field})`, {
      available: (all ?? []).map((a) => a.name as string),
    }),
  };
}

async function resolveCategory(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  kind: CategoryKind
): Promise<Resolved> {
  const { data } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', userId)
    .eq('kind', kind)
    .ilike('name', escapeLike(name))
    .maybeSingle();

  if (data) return { id: data.id as string, name: data.name as string };

  const { data: all } = await supabase
    .from('categories')
    .select('name')
    .eq('user_id', userId)
    .eq('kind', kind);
  return {
    error: apiError('not_found', `No ${kind} category named "${name}"`, {
      available: (all ?? []).map((c) => c.name as string),
    }),
  };
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return apiError('invalid_body', 'Body must be valid JSON');
  }

  const tipe = (body.tipe ?? 'expense') as TransactionType;
  if (!TYPES.includes(tipe)) {
    return apiError('invalid_body', `"tipe" must be one of: ${TYPES.join(', ')}`);
  }

  const tanggal = body.tanggal?.trim() || todayISODateJakarta();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return apiError('invalid_body', '"tanggal" must be YYYY-MM-DD');
  }

  // --- resolve names → ids -------------------------------------------------
  let categoryId: string | null = body.categoryId ?? null;
  let categoryName: string | null = null;
  if (tipe !== 'transfer' && !categoryId) {
    if (!body.category) return apiError('invalid_body', 'Provide "category" (name) or "categoryId"');
    const resolved = await resolveCategory(supabase, userId, body.category, tipe);
    if ('error' in resolved) return resolved.error;
    categoryId = resolved.id;
    categoryName = resolved.name;
  }

  let accountId = body.accountId ?? '';
  let accountName: string | null = null;
  if (!accountId) {
    if (!body.account) return apiError('invalid_body', 'Provide "account" (name) or "accountId"');
    const resolved = await resolveAccount(supabase, userId, body.account, 'account');
    if ('error' in resolved) return resolved.error;
    accountId = resolved.id;
    accountName = resolved.name;
  }

  let accountToId: string | null = body.accountToId ?? null;
  let accountToName: string | null = null;
  if (tipe === 'transfer' && !accountToId) {
    if (!body.accountTo) return apiError('invalid_body', 'Provide "accountTo" (name) or "accountToId"');
    const resolved = await resolveAccount(supabase, userId, body.accountTo, 'accountTo');
    if ('error' in resolved) return resolved.error;
    accountToId = resolved.id;
    accountToName = resolved.name;
  }

  const input: TransactionInput = {
    tanggal,
    tipe,
    categoryId,
    accountId,
    accountToId,
    jumlah: parseAmount(body.jumlah),
    catatan: body.catatan?.trim() ?? '',
  };

  const invalid = validateTransactionInput(input);
  if (invalid) return apiError('validation_failed', invalid);

  const { data: inserted, error } = await supabase
    .from('transactions')
    .insert({ user_id: userId, ...buildTransactionRow(input) })
    .select('id')
    .single();

  if (error) return apiError('server_error', error.message);

  // Keep the web app in step, exactly as actions/transactions.ts does.
  revalidatePath('/dashboard');
  revalidatePath('/history');
  revalidatePath('/fund');

  const after = await summariseAfter(supabase, userId, input);

  return NextResponse.json(
    {
      ok: true,
      message: transactionSavedMessage(input),
      transaction: {
        id: inserted.id as string,
        tanggal: input.tanggal,
        tipe: input.tipe,
        jumlah: input.jumlah,
        category: categoryName,
        account: accountName,
        accountTo: accountToName,
        catatan: input.catatan || null,
      },
      after,
    },
    { status: 201 }
  );
}

/**
 * The balance and budget state the caller most likely wants to show in a notification —
 * bundled in so a Shortcut doesn't need a second round-trip just to confirm the result.
 */
async function summariseAfter(supabase: SupabaseClient, userId: string, input: TransactionInput) {
  const [year, month] = input.tanggal.split('-').map(Number);
  const { start, end } = getMonthRange(year, month - 1);

  const [balRes, budgetRes, monthRes] = await Promise.all([
    supabase.from('account_balances').select('account_id, balance').eq('user_id', userId),
    input.categoryId
      ? supabase.from('budgets').select('*').eq('user_id', userId).eq('category_id', input.categoryId).maybeSingle()
      : Promise.resolve({ data: null }),
    input.categoryId
      ? supabase
          .from('transactions')
          .select('jumlah')
          .eq('user_id', userId)
          .eq('tipe', input.tipe)
          .eq('category_id', input.categoryId)
          .gte('tanggal', start)
          .lte('tanggal', end)
      : Promise.resolve({ data: [] }),
  ]);

  const balances = new Map(
    ((balRes.data ?? []) as { account_id: string; balance: number }[]).map((b) => [b.account_id, b.balance])
  );
  const budget = budgetRes.data as Budget | null;
  const categoryTotal = ((monthRes.data ?? []) as Pick<Transaction, 'jumlah'>[]).reduce(
    (sum, t) => sum + t.jumlah,
    0
  );

  return {
    accountBalance: balances.get(input.accountId) ?? null,
    accountToBalance: input.accountToId ? balances.get(input.accountToId) ?? null : null,
    categoryTotalThisMonth: input.categoryId ? categoryTotal : null,
    categoryTarget: budget?.target_amount ?? null,
  };
}
