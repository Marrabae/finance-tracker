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
2. Run each file in [`supabase/migrations/`](supabase/migrations/) **in order**, pasting the whole
   file and clicking **Run**:
   - `0001_init.sql` — all tables, RLS policies, the derived-balance views, and a
     `seed_default_data()` helper function.
   - `0002_recurring_categories.sql` — the `is_recurring` flag on categories.
   - `0003_api_tokens.sql` — the `api_tokens` table used by the Shortcuts API.

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
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```
`SUPABASE_SERVICE_ROLE_KEY` (same **Data API** page as the anon key) is only needed by the
[Shortcuts API](#api-for-ios-shortcuts) — it has no `NEXT_PUBLIC_` prefix, so it never reaches the
browser. Keep it secret: it bypasses RLS.
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
3. In **Project Settings → Environment Variables**, add the same three variables from step 4
   (for Production *and* Preview) — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`.
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
  (app)/settings/page.tsx     Categories, accounts, budgets, fund settings, API tokens, sign out
  api/v1/{transactions,summary,lookups}/route.ts   Token-authenticated REST API
proxy.ts                      Session refresh + route protection (Next.js "proxy"/middleware)
lib/
  supabase/{client,server,middleware}.ts   Browser / server / proxy Supabase clients
  supabase/admin.ts           Service-role client — API routes only, bypasses RLS
  api/{auth,token,response}.ts             Bearer-token auth + shared API response shapes
  transactions.ts             Transaction validation/row shape, shared by actions and API
  constants.ts, format.ts, types.ts, derive.ts
actions/                      Server Actions: transactions, accounts, categories, budgets, fund, api-tokens
components/                   ui/ (shared primitives), nav/, and one folder per screen
supabase/migrations/          DB schema, RLS policies, views, seed function
```

## Data model notes

- Account and emergency-fund ("Dana Darurat") balances are **derived**, never stored redundantly:
  computed via the `account_balances` and `fund_balances` Postgres views from `starting_balance`
  plus the relevant transactions.
- Deleting a category or account that's referenced by transactions is blocked (checked in the
  Server Action, and enforced at the DB level via `on delete restrict`).
- All 5 tables have Row Level Security scoped to `auth.uid() = user_id` — even though this is a
  single-user app, RLS means the anon key alone can never read or write another user's rows.

## API for iOS Shortcuts

A small REST API at `/api/v1` lets you log a transaction from your phone without opening the app —
three taps in a Shortcut, or a Siri phrase.

### Authentication

Modelled on Notion's integration secrets. Go to **Settings → API tokens**, give the token a name
(e.g. "iPhone Shortcuts"), and copy it — **it is shown exactly once**, because only its SHA-256 hash
is stored. Send it on every request:

```
Authorization: Bearer ft_xxxxxxxxxxxxxxxxxxxx
```

Tokens are per-user, so anything a token can reach is scoped to whoever created it. Revoking a token
in Settings takes effect immediately.

### Endpoints

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/api/v1/lookups` | All accounts (with balances) and categories — one call to fill every picker |
| `POST` | `/api/v1/transactions` | Log an expense, income, or transfer |
| `GET` | `/api/v1/summary` | Month totals, balances, budget progress, emergency-fund progress |

Errors always come back as `{ "ok": false, "error": { "code", "message" } }` with a matching HTTP
status — `401` unauthorized, `400` invalid body / failed validation, `404` unknown category or
account name (with the valid names in `error.details.available`), `500` server error.

#### `GET /api/v1/lookups`

```bash
curl -s https://<your-app>.vercel.app/api/v1/lookups \
  -H "Authorization: Bearer $TOKEN"
```
```json
{ "ok": true,
  "accounts": [{ "id": "…", "name": "Cash", "balance": 1250000 }],
  "categories": {
    "expense": [{ "id": "…", "name": "Makan Warkop", "is_recurring": false }],
    "income":  [{ "id": "…", "name": "Gaji" }]
  } }
```

#### `POST /api/v1/transactions`

Categories and accounts are matched **by name**, case-insensitively, so a Shortcut never has to
carry UUIDs. `categoryId` / `accountId` / `accountToId` are accepted too and win if both are sent.

| Field | Required | Notes |
| --- | --- | --- |
| `jumlah` | yes | Number or string — `25000` and `"25.000"` both work |
| `tipe` | no | `expense` (default), `income`, or `transfer` |
| `category` | for non-transfers | Category name, matched within the kind implied by `tipe` |
| `account` | yes | Account name; the source account for transfers |
| `accountTo` | for transfers | Destination account name |
| `tanggal` | no | `YYYY-MM-DD`; defaults to today in Asia/Jakarta |
| `catatan` | no | Free-text note |

```bash
curl -s -X POST https://<your-app>.vercel.app/api/v1/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tipe":"expense","jumlah":25000,"category":"Makan Warkop","account":"Cash","catatan":"kopi"}'
```
```json
{ "ok": true,
  "message": "Expense of Rp25.000 saved",
  "transaction": { "id": "…", "tanggal": "2026-07-23", "tipe": "expense", "jumlah": 25000,
                   "category": "Makan Warkop", "account": "Cash", "accountTo": null,
                   "catatan": "kopi" },
  "after": { "accountBalance": 1225000, "accountToBalance": null,
             "categoryTotalThisMonth": 175000, "categoryTarget": 500000 } }
```

`message` and `after` are there so a Shortcut can show a useful notification without a second
request.

#### `GET /api/v1/summary`

Optional `?year=2026&month=7` (`month` is 1-12); defaults to the current month in Asia/Jakarta.

```bash
curl -s "https://<your-app>.vercel.app/api/v1/summary?year=2026&month=7" \
  -H "Authorization: Bearer $TOKEN"
```
```json
{ "ok": true, "month": "2026-07",
  "income": 8000000, "expense": 3200000, "net": 4800000, "transactionCount": 24,
  "accounts": [{ "name": "Cash", "balance": 1225000 }],
  "budgets": [{ "kategori": "Makan Warkop", "actual": 175000, "target": 500000,
                "pct": 35, "over": false, "isRecurring": false }],
  "fund": { "current": 5000000, "target": 20000000, "pct": 25,
            "left": 15000000, "monthsLeft": 15, "etaLabel": "Oct 2027" },
  "text": "Jul 2026 — masuk Rp8.000.000, keluar Rp3.200.000, sisa Rp4.800.000" }
```

The numbers are derived with the same `lib/derive.ts` helpers the Dashboard uses, so they can't
drift from what the web shows. `text` is a ready-made notification line.

### Building the Shortcut

A minimal "log an expense" Shortcut:

1. **Ask for Input** → *Number*, prompt "Berapa?" → this becomes `Provided Input`.
2. **Choose from Menu** → one item per category you use often (Makan Warkop, Transport, …).
3. In each branch, **Text** with the category name → then **Get Contents of URL**:
   - URL: `https://<your-app>.vercel.app/api/v1/transactions`
   - Method: `POST`
   - Headers: `Authorization` = `Bearer ft_…`, `Content-Type` = `application/json`
   - Request Body: `JSON` with `jumlah` = Provided Input, `category` = the Text from step 3,
     `account` = e.g. `Cash`, `tipe` = `expense`
4. **Get Dictionary Value** → key `message` → **Show Notification**.

Add it to the Home Screen or trigger it with "Hey Siri, catat pengeluaran". For a summary widget,
make a second Shortcut that GETs `/api/v1/summary` and shows the `text` value.

## Adding another user

The app has no public sign-up, so a second person is added by hand — after that everything is
separated automatically by RLS (`auth.uid() = user_id` on every table).

1. Supabase → **Authentication → Users → Add user**, with **Auto Confirm User** on.
2. Copy the new UUID, then in **SQL Editor**: `select public.seed_default_data('<their-uuid>');`
3. They sign in at your app URL and get their own categories, accounts, budgets, and fund settings.
4. They create their own token in **Settings → API tokens** for their own Shortcuts.

## Local commands

```bash
npm run dev      # local dev server
npm run build    # production build (type-checks too)
npm run lint     # ESLint
```
 