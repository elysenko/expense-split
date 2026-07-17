# Pipeline Task Decomposition

## Summary
A full-stack roommate expense-splitting web app: a React + Vite SPA served by an Express/Prisma/PostgreSQL API. Users sign up with email/password, create or join households via 6-char join codes, log equal-split expenses (money stored as integer cents), view pairwise balances, and record settle-up repayments. Routes are URL-addressable (deep-linkable filters), a demo seed prints `SEED_CREDS_JSON`, and the UI is mobile-first (usable at 375px). Auth is `full_auth` (JWT Bearer); the first signup becomes ADMIN, later users become USER.

## Surface contract

### Public routes (no auth)
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/health`, `GET /api/health/deep`
- UI: `/login`, `/signup`

### Authenticated API routes
- `POST /api/households` (create), `POST /api/households/join` (join by code), `GET /api/households/:id`, `GET /api/households` (list mine), `GET /api/households/:id/members`
- `GET /api/households/:id/expenses` (filters: `member`, `from`, `to`), `POST /api/households/:id/expenses`, `GET /api/expenses/:id`
- `POST /api/households/:id/settlements`, `GET /api/households/:id/settlements`
- `GET /api/households/:id/balances` → per-member net + pairwise `owes` list

### Admin API routes
- `(admin)` route group protected by admin guard; `GET /api/admin/settings`, `PATCH /api/admin/settings`

### Authenticated UI screens
- `/` (redirect to most-recent household or onboarding), `/households/:id` (Dashboard)
- `/history` (filters bound to `?member=&from=&to=`)
- `/settings` (HouseholdSettings — join code, members, create/join forms)
- `/expenses/:id` (ExpenseDetail)
- Modal routes `?modal=add-expense` (AddExpense) and `?modal=settle` (SettleUp)
- `/admin/settings` (admin-only, visible in nav only to admins)

### Entities
- `User(id, email @unique, passwordHash, name, role, createdAt)`
- `Household(id, name, joinCode @unique, createdAt)`
- `Membership(userId, householdId, joinedAt, @@unique([userId, householdId]))`
- `Expense(id, householdId, description, amountCents Int, payerId, createdAt)`
- `ExpenseShare(expenseId, userId, shareCents Int)`
- `Settlement(id, householdId, fromUserId, toUserId, amountCents Int, createdAt)`
- `SystemSetting(key @id, value, updatedAt)`

### Key testids
- `balances-heading`, `dashboard-main`, `expense-list`, plus empty-state testids on Dashboard.

## db_agent tasks
- [ ] Author `backend/prisma/schema.prisma` with the `User` model — `id`, `email @unique`, `passwordHash`, `name`, `createdAt` — plus `enum UserRole { ADMIN USER }` and `role UserRole @default(USER)` on User.
- [ ] Add `Household(id, name, joinCode @unique, createdAt)` model.
- [ ] Add `Membership(userId, householdId, joinedAt)` model with `@@unique([userId, householdId])` and relations to User + Household.
- [ ] Add `Expense(id, householdId, description, amountCents Int, payerId, createdAt)` model with relations to Household + payer (User).
- [ ] Add `ExpenseShare(expenseId, userId, shareCents Int)` model with relations to Expense + User.
- [ ] Add `Settlement(id, householdId, fromUserId, toUserId, amountCents Int, createdAt)` model with relations to Household + from/to Users.
- [ ] Add `SystemSetting` model — `key String @id`, `value String`, `updatedAt DateTime @updatedAt` — for admin-configurable service credentials (postgresql, minio, llm).
- [ ] Generate the initial Prisma migration for all models and configure `src/db.ts` Prisma client singleton usage expectations (schema-side only).

## backend_agent tasks
- [ ] `src/auth/jwt.ts` — HS256 sign/verify using `JWT_SECRET` (fail fast if missing) and bcrypt password hashing helpers.
- [ ] `src/routes/auth.ts` — `POST /api/auth/signup` (bcrypt hash, create user, first user gets `ADMIN` role, subsequent users get `USER`, return JWT), `POST /api/auth/login` (verify + JWT), `GET /api/auth/me`; Zod-validate all inputs.
- [ ] `src/middleware/auth.ts` — `requireAuth` reads `Authorization: Bearer`, verifies JWT, attaches `req.userId`; returns 401 when missing/invalid.
- [ ] `src/middleware/householdMember.ts` — assert `req.userId` is a `Membership` of the target household; 403 otherwise.
- [ ] Admin guard middleware — assert authenticated user has `role = ADMIN`; protect the `(admin)` route group.
- [ ] `src/routes/households.ts` — create household (generate unique 6-char uppercase alphanumeric join code, add creator as member), join by code (idempotent membership), `GET /api/households/:id`, list mine, get members/settings.
- [ ] `src/routes/expenses.ts` — create expense (validate payer + selected members belong to household; split `amountCents` equally distributing remainder cents to earliest members so shares sum exactly; persist `Expense` + `ExpenseShare[]`); list with `member`/`from`/`to` filters ordered `createdAt desc`; `GET /api/expenses/:id` returns expense + shares.
- [ ] `src/routes/settlements.ts` — `POST` record repayment (from/to/amount, validate members), `GET` list settlements for a household.
- [ ] `src/lib/balances.ts` — pure `computeBalances()` computing per-member net (`sum(paid) − sum(owed) + settlements`) and pairwise "A owes B" list via greedy debt reduction (no phantom debts).
- [ ] `src/routes/balances.ts` — `GET /api/households/:id/balances` returning per-member net + pairwise `owes` list.
- [ ] `src/routes/health.ts` — `GET /api/health` (200 ok), `GET /api/health/deep` (DB `SELECT 1`).
- [ ] `src/server.ts` — Express bootstrap, JSON + CORS middleware, mount routers under `/api` (matched before catch-all), serve `frontend/dist` static with SPA fallback for non-`/api` routes.
- [ ] `lib/config.ts` — `resolveConfig(key): string | null` reading `process.env[key]` first; if value equals `PLACEHOLDER_CONFIGURE_IN_SETTINGS` or absent, read from `SystemSetting` DB row; return null if neither set.
- [ ] `src/routes/admin/settings.ts` — `GET /api/admin/settings` (list all service keys for postgresql, minio, llm with masked values + configured status) and `PATCH /api/admin/settings` (upsert key-value pairs, admin role required).
- [ ] `backend/prisma/seed.ts` — create demo household, 3 users (known passwords, first = ADMIN), ~10 expenses across members and a settlement or two; guard idempotency; print `SEED_CREDS_JSON={...}` to stdout.

## ui_agent tasks
- [ ] `src/main.tsx` + `src/App.tsx` — React Router v6 route tree: public `/login`, `/signup`; guarded `/`, `/households/:id`, `/history`, `/settings`, `/expenses/:id`; admin `/admin/settings`.
- [ ] `src/pages/Login.tsx` and `src/pages/Signup.tsx` — public email/password forms part of the main app.
- [ ] `src/auth/AuthContext.tsx` + `src/auth/RequireAuth.tsx` — auth state + route guard redirecting unauthenticated users to `/login`.
- [ ] `src/components/Layout.tsx` — mobile nav; admin section (link to `/admin/settings`) visible only to ADMIN users.
- [ ] `src/pages/Dashboard.tsx` + `src/components/BalancesPanel.tsx` + `src/components/ExpenseList.tsx` — recent expenses + Balances section; render `<h2 data-testid="balances-heading">Balances</h2>`, `data-testid="dashboard-main"`, `data-testid="expense-list"`, and empty states with testids; modal routes `?modal=add-expense` / `?modal=settle`.
- [ ] `src/pages/AddExpense.tsx` and `src/pages/SettleUp.tsx` — forms opened via `?modal=add-expense` / `?modal=settle`.
- [ ] `src/pages/History.tsx` — filters bound to `?member=&from=&to=` via `useSearchParams`; changing a filter updates the URL; params drive query on load/reload.
- [ ] `src/pages/HouseholdSettings.tsx` — join code display, member list, create/join household forms.
- [ ] `src/pages/ExpenseDetail.tsx` — single expense view at `/expenses/:id`.
- [ ] `src/components/EmptyState.tsx` — reusable empty-state component with testids.
- [ ] `src/pages/AdminSettings.tsx` at `/admin/settings` — list each service in `postgresql, minio, llm` with configured/unconfigured badge and per-service credential form (admin-only).
- [ ] `src/styles.css` — mobile-first layout, stacked nav, fluid widths; all pages usable at 375px with no horizontal scroll.

## service_agent tasks
- [ ] `src/api/client.ts` — fetch wrapper injecting JWT from localStorage into `Authorization: Bearer`; on 401 clear token and redirect to `/login`.
- [ ] Auth data layer — signup/login/me/logout calls wired to `/api/auth/*`, persisting the JWT.
- [ ] Households data layer — create, join-by-code, list mine, get one, get members wired to `/api/households/*`.
- [ ] Expenses data layer — create, list with `member`/`from`/`to` query params, get one wired to `/api/households/:id/expenses` and `/api/expenses/:id`.
- [ ] Settlements + balances data layer — create/list settlements and fetch `/api/households/:id/balances`.
- [ ] Admin settings data layer — GET/PATCH `/api/admin/settings` for the AdminSettings page.

## tester tasks
- [ ] Auth: signup → login → `/me` returns user; bad password rejected; guarded route without token → 401; first signup is ADMIN, second is USER.
- [ ] Households: create returns join code; second user joins with code → appears in members list.
- [ ] Expenses: add expense with N members → each share = amount/N with remainder distributed and shares summing exactly to total; appears in recent list.
- [ ] Balances: after expenses, per-member nets sum to zero; pairwise reflects who owes whom.
- [ ] Settle up: record A→B repayment → pairwise A–B decreases by that amount.
- [ ] Deep-links: filter history, copy URL, reload → same filtered view; visiting `/expenses/:id` renders detail.
- [ ] Health: `/api/health` → 200; `/api/health/deep` → 200 when DB up.
- [ ] Seed: run seed → `SEED_CREDS_JSON` on stdout; logging in with those creds shows seeded dashboard.
- [ ] Mobile: load dashboard at 375px → nav + Balances visible, no horizontal scroll; required testids present.
- [ ] Admin settings: non-admin blocked from `/api/admin/settings`; admin can view masked service keys and PATCH values.

## Open questions
- The spec states "no admin surface since spec says plain users only," but the pipeline auth model is `full_auth` with roles `admin, user` and provisioned backing services (postgresql, minio, llm) that require an admin settings surface. Tasks include the admin role, `(admin)` route group, and `/admin/settings` per pipeline rules — confirm whether the admin surface should be exposed in the UI nav or kept minimal.
- Backing services `minio` and `llm` are provisioned but the spec declares "Integrations: None" and describes no object-storage or LLM behaviour. No integration client modules were generated; admin settings only expose their credential keys. Confirm whether minio/llm are actually used by any feature.
- `<placeholder_services>` and `<placeholder_integrations>` were not provided as non-empty, so no "needs credentials to activate" banner was specified for the settings page — confirm whether any service ships with placeholder credentials.
- Root `/` behaviour: spec says redirect to most-recently-active household or onboarding — confirm the onboarding screen when a user belongs to no household.
