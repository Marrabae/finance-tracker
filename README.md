# Finance Tracker

A personal finance tracker — budgets, multi-account balances, transfers, and an automatic
emergency-fund tracker. Next.js (App Router) + Supabase (Postgres + Auth), deployed to Vercel.

## Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4 → deployed to Vercel
- **Backend + DB**: Supabase (Postgres, Auth, Row Level Security) via `@supabase/ssr`
- **Auth**: Supabase Auth, single user (email/password), no public sign-up page
- **Mutations**: Next.js Server Actions (`actions/*.ts`)

## One-time setup

You'll need a free [Supabase](https://supabase.com) account and a free [Vercel](https://vercel.com)
account. Do these once, in order.

### 1. Create the Supabase project
1. Go to supabase.com → **New project**. Pick any name/region/password (the DB password isn't
   needed elsewhere — Supabase manages the connection for you).
2. Once it's provisioned, go to **Project Settings → Data API** (or **API**) and copy:
   - **Project URL**
   - **anon / public key**

### 2. Run the schema
1. In the Supabase dashboard, open **SQL Editor**.
2. Paste the entire contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   and click **Run**. This creates all tables, RLS policies, the derived-balance views, and a
   `seed_default_data()` helper function.

### 3. Create your user (no public sign-up page, by design)
1. **Authentication → Users → Add user** — enter your email + a password, and toggle
   **Auto Confirm User** (or "email confirmed") on.
2. Copy the new user's **UUID** (shown in the users table).
3. Back in **SQL Editor**, run (replacing the UUID):
   ```sql
   select public.seed_default_data('paste-your-uuid-here');
   ```
   This creates your default categories (Hutang, Langganan, Makan Kantor, …), a zero-target
   budget row per expense category, an empty fund-settings row, and a starter "Cash" account.

### 4. Local development
Create `.env.local` in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```
Then:
```bash
npm install
npm run dev
```
Open <http://localhost:3000>, sign in with the user you created, and confirm all 5 tabs
(Dashboard, Input, History, Fund, Settings) load.

### 5. Deploy
1. Push this repo to a new GitHub repository.
2. On vercel.com: **Add New… → Project** → import that repo.
3. In **Project Settings → Environment Variables**, add the same two variables from step 4
   (for Production *and* Preview) — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy. Open the `https://<project>.vercel.app` URL from your phone or another network and
   confirm you can sign in and see your data — that confirms it's genuinely hosted, not tied to
   your machine.

## Project structure

```
app/
  (auth)/login/page.tsx       Sign-in form
  (app)/layout.tsx            Authenticated shell (top nav / bottom nav)
  (app)/dashboard/page.tsx    Month summary, account balances, budget progress
  (app)/input/page.tsx        Add/edit a transaction
  (app)/history/page.tsx      Filterable, grouped transaction list
  (app)/fund/page.tsx         Emergency fund progress
  (app)/settings/page.tsx     Categories, accounts, budgets, fund settings, sign out
proxy.ts                      Session refresh + route protection (Next.js "proxy"/middleware)
lib/
  supabase/{client,server,middleware}.ts   Browser / server / proxy Supabase clients
  constants.ts, format.ts, types.ts, derive.ts
actions/                      Server Actions: transactions, accounts, categories, budgets, fund
components/                   ui/ (shared primitives), nav/, and one folder per screen
supabase/migrations/0001_init.sql   Full DB schema, RLS policies, views, seed function
```

## Data model notes

- Account and emergency-fund ("Dana Darurat") balances are **derived**, never stored redundantly:
  computed via the `account_balances` and `fund_balances` Postgres views from `starting_balance`
  plus the relevant transactions.
- Deleting a category or account that's referenced by transactions is blocked (checked in the
  Server Action, and enforced at the DB level via `on delete restrict`).
- All 5 tables have Row Level Security scoped to `auth.uid() = user_id` — even though this is a
  single-user app, RLS means the anon key alone can never read or write another user's rows.

## Local commands

```bash
npm run dev      # local dev server
npm run build    # production build (type-checks too)
npm run lint     # ESLint
```
