-- Finance Tracker — initial schema
-- Run this once in the Supabase SQL Editor (or via `supabase db push`).

-- ============================================================ ACCOUNTS ----
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  starting_balance bigint not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- =========================================================== CATEGORIES ---
create type category_kind as enum ('expense', 'income');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind category_kind not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, name)
);

-- ============================================================== BUDGETS ---
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  target_amount bigint not null default 0,
  unique (user_id, category_id)
);

-- ========================================================= TRANSACTIONS ---
create type transaction_type as enum ('expense', 'income', 'transfer');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tanggal date not null,
  tipe transaction_type not null,
  -- null only for transfers; the "Transfer" label is derived in the UI, not stored
  category_id uuid references public.categories(id) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete restrict,
  account_to_id uuid references public.accounts(id) on delete restrict,
  jumlah bigint not null check (jumlah > 0),
  catatan text,
  created_at timestamptz not null default now(),
  constraint transfer_requires_dest check (
    (tipe = 'transfer' and account_to_id is not null and account_to_id <> account_id)
    or (tipe <> 'transfer' and account_to_id is null)
  ),
  constraint non_transfer_requires_category check (
    (tipe = 'transfer' and category_id is null)
    or (tipe <> 'transfer' and category_id is not null)
  )
);

create index transactions_user_month_idx on public.transactions (user_id, tanggal);
create index transactions_user_account_idx on public.transactions (user_id, account_id);
create index transactions_user_category_idx on public.transactions (user_id, category_id);

-- ======================================================= FUND SETTINGS ----
create table public.fund_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_amount bigint not null default 0,
  starting_balance bigint not null default 0,
  monthly_deposit bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- ==================================================================== RLS -
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.budgets enable row level security;
alter table public.transactions enable row level security;
alter table public.fund_settings enable row level security;

create policy "accounts_select_own" on public.accounts for select using (auth.uid() = user_id);
create policy "accounts_insert_own" on public.accounts for insert with check (auth.uid() = user_id);
create policy "accounts_update_own" on public.accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "accounts_delete_own" on public.accounts for delete using (auth.uid() = user_id);

create policy "categories_select_own" on public.categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories for delete using (auth.uid() = user_id);

create policy "budgets_select_own" on public.budgets for select using (auth.uid() = user_id);
create policy "budgets_insert_own" on public.budgets for insert with check (auth.uid() = user_id);
create policy "budgets_update_own" on public.budgets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets_delete_own" on public.budgets for delete using (auth.uid() = user_id);

create policy "transactions_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions for delete using (auth.uid() = user_id);

create policy "fund_settings_select_own" on public.fund_settings for select using (auth.uid() = user_id);
create policy "fund_settings_insert_own" on public.fund_settings for insert with check (auth.uid() = user_id);
create policy "fund_settings_update_own" on public.fund_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================= VIEWS ------
create view public.account_balances as
select
  a.id as account_id,
  a.user_id,
  a.name,
  a.starting_balance,
  a.starting_balance
    + coalesce(sum(case when t.tipe = 'income' and t.account_id = a.id then t.jumlah
                         when t.tipe = 'transfer' and t.account_to_id = a.id then t.jumlah
                         else 0 end), 0)
    - coalesce(sum(case when t.tipe = 'expense' and t.account_id = a.id then t.jumlah
                         when t.tipe = 'transfer' and t.account_id = a.id then t.jumlah
                         else 0 end), 0)
    as balance
from public.accounts a
left join public.transactions t
  on t.user_id = a.user_id and (t.account_id = a.id or t.account_to_id = a.id)
group by a.id, a.user_id, a.name, a.starting_balance;

alter view public.account_balances set (security_invoker = true);

create view public.fund_balances as
select
  f.user_id,
  f.target_amount,
  f.starting_balance,
  f.monthly_deposit,
  f.starting_balance + coalesce((
    select sum(t.jumlah)
    from public.transactions t
    join public.categories c on c.id = t.category_id
    where t.user_id = f.user_id and t.tipe = 'expense' and c.name = 'Dana Darurat'
  ), 0) as current_balance,
  coalesce((
    select sum(t.jumlah)
    from public.transactions t
    join public.categories c on c.id = t.category_id
    where t.user_id = f.user_id and t.tipe = 'expense' and c.name = 'Dana Darurat'
  ), 0) as deposited_total
from public.fund_settings f;

alter view public.fund_balances set (security_invoker = true);

-- ======================================================== SEED FUNCTION ---
-- Run once per new user: select public.seed_default_data('<user-uuid>');
create or replace function public.seed_default_data(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.categories (user_id, kind, name) values
    (p_user_id, 'expense', 'Hutang'),
    (p_user_id, 'expense', 'Langganan'),
    (p_user_id, 'expense', 'Ibu'),
    (p_user_id, 'expense', 'Makan Kantor'),
    (p_user_id, 'expense', 'Makan Warkop'),
    (p_user_id, 'expense', 'Nongkrong Sosial'),
    (p_user_id, 'expense', 'Transport'),
    (p_user_id, 'expense', 'Internet/Pulsa'),
    (p_user_id, 'expense', 'Dana Darurat'),
    (p_user_id, 'expense', 'Buffer Tak Terduga'),
    (p_user_id, 'income', 'Gaji'),
    (p_user_id, 'income', 'Bonus'),
    (p_user_id, 'income', 'Freelance'),
    (p_user_id, 'income', 'Lainnya')
  on conflict do nothing;

  insert into public.budgets (user_id, category_id, target_amount)
    select p_user_id, id, 0
    from public.categories
    where user_id = p_user_id and kind = 'expense'
  on conflict do nothing;

  insert into public.fund_settings (user_id, target_amount, starting_balance, monthly_deposit)
    values (p_user_id, 0, 0, 0)
  on conflict do nothing;

  insert into public.accounts (user_id, name, starting_balance)
    values (p_user_id, 'Cash', 0)
  on conflict do nothing;
end;
$$;
