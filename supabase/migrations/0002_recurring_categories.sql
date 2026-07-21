-- Adds a "recurring bill" flag to expense categories so the Dashboard can separate
-- fixed monthly obligations (Hutang, Langganan, Internet/Pulsa, Ibu, ...) from
-- discretionary/variable spending. Run this once, after 0001_init.sql.

alter table public.categories
  add column is_recurring boolean not null default false;

-- Mark the default "fixed bill"-style categories as recurring for existing users.
-- Safe to run even if you've already added/removed categories — only touches these names.
update public.categories
  set is_recurring = true
  where kind = 'expense' and name in ('Hutang', 'Langganan', 'Internet/Pulsa', 'Ibu');

-- Keep the seed function in sync for any future users.
create or replace function public.seed_default_data(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.categories (user_id, kind, name, is_recurring) values
    (p_user_id, 'expense', 'Hutang', true),
    (p_user_id, 'expense', 'Langganan', true),
    (p_user_id, 'expense', 'Ibu', true),
    (p_user_id, 'expense', 'Makan Kantor', false),
    (p_user_id, 'expense', 'Makan Warkop', false),
    (p_user_id, 'expense', 'Nongkrong Sosial', false),
    (p_user_id, 'expense', 'Transport', false),
    (p_user_id, 'expense', 'Internet/Pulsa', true),
    (p_user_id, 'expense', 'Dana Darurat', false),
    (p_user_id, 'expense', 'Buffer Tak Terduga', false),
    (p_user_id, 'income', 'Gaji', false),
    (p_user_id, 'income', 'Bonus', false),
    (p_user_id, 'income', 'Freelance', false),
    (p_user_id, 'income', 'Lainnya', false)
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
