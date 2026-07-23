-- Personal API tokens, so external clients (iOS Shortcuts, scripts) can talk to /api/v1
-- without a browser session. Modelled on Notion's integration secrets: the plaintext token
-- is shown exactly once at creation and only its SHA-256 hash is stored here.
-- Run this once, after 0002_recurring_categories.sql.

create table public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  -- sha256 hex of the full token; the plaintext is never stored
  token_hash text not null unique,
  -- first few chars ("ft_a1b2c3d4"), shown in Settings so a token is recognisable
  token_prefix text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index api_tokens_user_idx on public.api_tokens (user_id);

alter table public.api_tokens enable row level security;

-- Same per-user scoping as every other table: each user only ever sees their own tokens,
-- which is what makes the Settings UI safe to expose to a second user.
create policy "api_tokens_select_own" on public.api_tokens for select using (auth.uid() = user_id);
create policy "api_tokens_insert_own" on public.api_tokens for insert with check (auth.uid() = user_id);
create policy "api_tokens_update_own" on public.api_tokens for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "api_tokens_delete_own" on public.api_tokens for delete using (auth.uid() = user_id);
