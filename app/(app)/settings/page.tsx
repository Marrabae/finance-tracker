import { createClient, getAuthedUser } from '@/lib/supabase/server';
import { CategoryManager } from '@/components/settings/CategoryManager';
import { AccountManager } from '@/components/settings/AccountManager';
import { BudgetTargetsForm } from '@/components/settings/BudgetTargetsForm';
import { FundSettingsForm } from '@/components/settings/FundSettingsForm';
import { SignOutButton } from '@/components/settings/SignOutButton';
import type { Account, Budget, Category, FundSettings } from '@/lib/types';

export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getAuthedUser();
  const userId = user!.id;

  const [catRes, accRes, budgetRes, fundRes] = await Promise.all([
    supabase.from('categories').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('accounts').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('budgets').select('*').eq('user_id', userId),
    supabase.from('fund_settings').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const categories = (catRes.data ?? []) as Category[];
  const accounts = (accRes.data ?? []) as Account[];
  const budgets = (budgetRes.data ?? []) as Budget[];
  const fund = fundRes.data as FundSettings | null;

  const expenseCategories = categories.filter((c) => c.kind === 'expense');
  const incomeCategories = categories.filter((c) => c.kind === 'income');
  const budgetByCategory = new Map(budgets.map((b) => [b.category_id, b.target_amount]));

  const budgetRows = expenseCategories.map((c) => ({
    categoryId: c.id,
    kategori: c.name,
    value: budgetByCategory.get(c.id) ?? 0,
    isRecurring: c.is_recurring,
  }));

  return (
    <div className="max-w-[560px] w-full mx-auto flex flex-col gap-3.5">
      <CategoryManager
        expenseCategories={expenseCategories.map((c) => ({ id: c.id, name: c.name }))}
        incomeCategories={incomeCategories.map((c) => ({ id: c.id, name: c.name }))}
      />
      <AccountManager accounts={accounts.map((a) => ({ id: a.id, name: a.name, starting_balance: a.starting_balance }))} />
      <BudgetTargetsForm rows={budgetRows} />
      <FundSettingsForm
        fund={{
          target_amount: fund?.target_amount ?? 0,
          starting_balance: fund?.starting_balance ?? 0,
          monthly_deposit: fund?.monthly_deposit ?? 0,
        }}
      />
      <div className="bg-white border border-[#e6e9e7] rounded-2xl px-5 py-[18px] flex flex-col gap-3">
        <div className="text-sm font-semibold">Account</div>
        <div className="text-xs text-[#6b7671]">Signed in as {user!.email}</div>
        <SignOutButton />
      </div>
    </div>
  );
}
