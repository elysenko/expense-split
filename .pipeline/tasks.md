# Pipeline Task Decomposition

## Summary
Roommate Expense Splitter — a mobile-first (usable at 375px) Next.js 15 App Router + Prisma + JWT monolith where authenticated users belong to a household, log shared expenses, split them equally (with remainder-cent distribution), view per-member and pairwise balances, settle up between members, and browse a URL-filterable expense history. Money is stored as integer cents throughout. A demo seed provisions a 3-member household with ~10 expenses and 1 settlement for instant login.

## Surface contract
Routes (public):
- `/login` — login form (`app/(auth)/login/page.tsx`)
- `/signup` — signup form (`app/(auth)/signup/page.tsx`)
- `/admin/login` — admin login (per full_auth auth model)
- `/` — redirect to `/dashboard` (or `/login` if unauthenticated)

Routes (guarded `(app)` group; require valid session; no membership → `/onboarding`):
- `/onboarding` — create-household / join-by-code
- `/dashboard` — recent expenses + Balances section; reads `?modal=add-expense|settle`
- `/history` — filtered expense list; reads `searchParams` `member`, `from`, `to`
- `/settings` — household settings (name, join-code, members)
- `/expenses/[id]` — expense detail
- `/admin/settings` — admin settings page (service/integration credentials)

API route handlers (`app/api/**/route.ts`):
- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`
- `POST /api/households`, `POST /api/households/join`
- `GET/POST /api/expenses`, `GET /api/expenses/[id]`
- `POST /api/settlements`
- `GET/PATCH /api/admin/settings`
- `GET /api/health` (existing, public)

Entities: `User` (+ `Role`/`UserRole`), `Household`, `Membership`, `Expense`, `ExpenseShare`, `Settlement`, `SystemSetting`.

Components: `LoginForm`, `SignupForm`, `Nav`, `AddExpenseModal`, `SettleUpModal`, `BalancesSection`, `ExpenseList`, `HistoryFilters`, `EmptyState`.

Key `data-testid`s: `dashboard-main`, `expense-list`, `expenses-empty`, `balances-heading` (heading text literally `Balances`); forms/inputs/submit on auth + modal components.

## db_agent tasks
- [ ] In `prisma/schema.prisma`, define `enum UserRole { ADMIN USER }` and add `role UserRole @default(USER)` to the `User` model (retain existing `User` fields; keep/align legacy `Role` enum if present). First signup user becomes `ADMIN`, subsequent `USER` (enforced in backend).
- [ ] Add `Household { id, name, joinCode String @unique, createdAt DateTime @default(now()) }`.
- [ ] Add `Membership { id, userId, householdId, joinedAt DateTime @default(now()), @@unique([userId, householdId]) }` with relations to `User` and `Household` and an index on `householdId`.
- [ ] Add `Expense { id, householdId, description String, amountCents Int, payerId, createdAt DateTime @default(now()) }` with relations + index on `householdId`.
- [ ] Add `ExpenseShare { id, expenseId, userId, shareCents Int }` with relation to `Expense` and index on `expenseId`.
- [ ] Add `Settlement { id, householdId, fromUserId, toUserId, amountCents Int, createdAt DateTime @default(now()) }` with relation to `Household` and index on `householdId`.
- [ ] Add `SystemSetting { key String @id, value String, updatedAt DateTime @updatedAt }` (admin settings backing store for provisioned services postgresql/minio).
- [ ] Run `npx prisma migrate dev --name init` to generate the initial migration.
- [ ] Update `prisma/seed.ts`: create 3 demo users via the shared `hashPassword`; the first is `ADMIN`, others `USER`; create one household with a join-code + 3 memberships; ~10 expenses each with equal-split `ExpenseShare`s summing exactly to the amount; 1 settlement. Keep `SEED_CRED`/`SEED_CREDS_JSON` stdout lines with working passwords.

## backend_agent tasks
- [ ] In `lib/auth.ts`, add `hashPassword`/`verifyPassword` (bcryptjs) and `SESSION_COOKIE = "session"`; keep `signToken`/`verifyToken`.
- [ ] Create `lib/prisma.ts` — global-cached Prisma client singleton (dev HMR safe).
- [ ] Create `lib/session.ts` — `getCurrentUser()` (read `session` cookie → `verifyToken` → Prisma user + first membership) and `requireSession()` (redirect to `/login` when absent).
- [ ] Create `lib/balances.ts` — pure `equalSplit(amountCents, memberIds)` distributing remainder cents to the first members so shares sum exactly to the total, and `computeBalances(expenses, settlements)` → per-member net (Σpaid − Σown shares, then settlements applied) + pairwise "X owes Y $Z".
- [ ] `app/api/auth/signup/route.ts` — validate email/password, reject duplicates, `hashPassword`, create user (first ever user → `ADMIN`, else `USER`), sign JWT, set httpOnly `session` cookie (`SameSite=Lax`, `Secure` in prod); return JSON with next redirect target.
- [ ] `app/api/auth/login/route.ts` — verify credentials with `verifyPassword`, set session cookie; `app/api/auth/logout/route.ts` — clear cookie.
- [ ] Admin guard: enforce `role === ADMIN` for the `(admin)` route group and `/api/admin/*` handlers; support admin login at `/admin/login`; admin access via role check in the `(admin)` layout.
- [ ] `app/api/households/route.ts` (`POST`) — create household + membership for caller, generate a unique `joinCode`, return it. `app/api/households/join/route.ts` (`POST`) — validate join-code, create membership.
- [ ] `app/api/expenses/route.ts` — `GET` filters by `member`/`from`/`to` scoped to caller's household; `POST` validates input, computes `equalSplit`, creates `Expense` + `ExpenseShare`s in a transaction. Authorize household membership.
- [ ] `app/api/expenses/[id]/route.ts` (`GET`) — expense detail with shares, membership-authorized.
- [ ] `app/api/settlements/route.ts` (`POST`) — create settlement between two members of the caller's household, membership-authorized.
- [ ] Create `lib/config.ts` with `resolveConfig(key)` — reads `process.env[key]` first; if value equals `PLACEHOLDER_CONFIGURE_IN_SETTINGS` or is absent, reads the `SystemSetting` DB row; returns `null` if neither is set.
- [ ] `app/api/admin/settings/route.ts` — `GET` lists service keys (postgresql, minio) with masked values + configured status; `PATCH` upserts key-value pairs into `SystemSetting` (admin role required).

## ui_agent tasks
- [ ] Update `app/layout.tsx` — global styles import, mobile viewport meta, app metadata; and `app/globals.css` — mobile-first responsive styles with no horizontal scroll at 375px.
- [ ] `app/page.tsx` — redirect `/` → `/dashboard` (or `/login` if unauthenticated).
- [ ] Auth pages: `app/(auth)/login/page.tsx` + `LoginForm`, `app/(auth)/signup/page.tsx` + `SignupForm` client components that POST to the auth APIs, show inline errors, and redirect to `/dashboard` (or `/onboarding`). Add `data-testid`s on forms/inputs/submit.
- [ ] `/admin/login` screen (full_auth admin login). Admin section in `Nav` visible only to admins.
- [ ] `app/(app)/layout.tsx` — server guard calling `getCurrentUser()`; redirect `/login` if no session, `/onboarding` if no membership; render responsive `Nav` shell.
- [ ] `app/(app)/onboarding/page.tsx` — create-household + join-by-code client forms; display the join-code after creation.
- [ ] `app/(app)/dashboard/page.tsx` — load household expenses/settlements/members via Prisma, compute balances with `lib/balances.ts`; render `main data-testid="dashboard-main"`, `ExpenseList` (`data-testid="expense-list"`, empty `data-testid="expenses-empty"`), `BalancesSection` with heading text literally `Balances` (`data-testid="balances-heading"`); read `?modal=add-expense|settle` to render modals.
- [ ] `components/AddExpenseModal.tsx` + `components/SettleUpModal.tsx` — URL-addressable via `?modal=`, closed by clearing the param. Add-expense: description, amount (dollars→cents), payer select, member checkboxes; Settle-up: from/to member + amount. POST to APIs then `router.refresh()`.
- [ ] `app/(app)/history/page.tsx` + `components/HistoryFilters.tsx` — server page reads `searchParams` (`member`, `from`, `to`) and renders filtered list; filters push selections to the URL query string so reloads reproduce the view; rows link to `/expenses/[id]`.
- [ ] `app/(app)/settings/page.tsx` — household name, copyable join-code, member list. `app/(app)/expenses/[id]/page.tsx` — description, amount, payer, per-member shares. Both server-rendered + membership-authorized. Add shared `components/EmptyState.tsx`.
- [ ] `app/(admin)/settings` → `/admin/settings` page — list each provisioned service (postgresql, minio) with a configured/unconfigured badge and a per-service credential form wired to `GET/PATCH /api/admin/settings`. (No spec integrations to render — see Open questions.)
- [ ] Update `.pipeline/surface.json` (all new routes/components/testids) and `.colossus-acceptance.json` (`ready_testid: "dashboard-main"`, `expect_text: ["Balances"]`, keep reject signatures). Add `bcryptjs` (+ `@types/bcryptjs` dev) to `package.json`.

## service_agent tasks
- [ ] Create a typed client-side data layer wrapping the auth endpoints (`signup`, `login`, `logout`) used by `LoginForm`/`SignupForm`, returning the next redirect target and surfacing inline validation errors.
- [ ] Wire household mutations (`POST /api/households`, `POST /api/households/join`) from the onboarding forms, exposing the returned join-code to the UI.
- [ ] Wire expense + settlement mutations from `AddExpenseModal`/`SettleUpModal` (`POST /api/expenses`, `POST /api/settlements`), converting dollars→cents client-side and calling `router.refresh()` on success.
- [ ] Provide a client helper for `HistoryFilters` that serializes `member`/`from`/`to` selections into the URL query string (and reads them back) so history views are reproducible on reload.
- [ ] Wire the `/admin/settings` credential forms to `GET/PATCH /api/admin/settings` (masked reads, upsert on save).

## tester tasks
- [ ] Unit tests for `lib/balances.ts`: `equalSplit` with even and odd amounts sums exactly to total; per-member net computation; a settlement reduces the A→B pairwise balance by the exact amount.
- [ ] API tests: signup→login sets the session cookie; unauthenticated `GET /api/expenses` is rejected; `POST /api/households` returns a join-code; `POST /api/households/join` adds a member; `POST /api/expenses` creates correct equal-split shares; `POST /api/settlements` updates balances; admin-only `PATCH /api/admin/settings` rejects non-admins.
- [ ] E2E/Playwright (via surface.json testids): signup → create household → add expense → see it in the recent `expense-list`; assert `balances-heading` present with text `Balances`; filter history by member → URL reflects the filter → reload reproduces the view; seeded creds log in and show the seeded dashboard.
- [ ] Mobile regression: render `/dashboard` at 375px — `Nav` + Balances visible, no horizontal scroll.
- [ ] Seed test: run `npx prisma db seed`, assert `SEED_CREDS_JSON` appears on stdout and those credentials authenticate.

## Open questions
- **Auth model conflict:** the pipeline auth model is `full_auth` (roles `admin, user`) and these tasks apply the full_auth rules (UserRole enum with `ADMIN`+`USER`, `/admin/login`, admin-guarded `(admin)` group, first-signup-becomes-admin). However the spec's Assumptions state "No admin role used (spec: plain users only)… all users seeded/created as `USER`." db_agent/backend_agent must reconcile: either seed the first user as `ADMIN` (per auth model) or keep all-`USER` (per spec). Confirm which wins before finalizing seed + signup role logic.
- **Admin settings vs. spec scope:** `spec_deployments` includes `postgresql, minio`, triggering `SystemSetting` + `/admin/settings` + `lib/config.ts` tasks — but the spec itself never mentions an admin settings surface, MinIO usage, or file storage. Confirm whether these backing services actually need runtime credential configuration or whether the admin settings surface should be minimal/omitted.
- **Integrations:** `spec_integrations` contains a single sentinel entry literally named "None (no third-party external services)" with a placeholder env key. Treated as *no integrations* — no integration client modules created. Confirm this interpretation (spec `## Integrations` says "None").
- **MinIO/file uploads:** no expense receipts or attachments are described in the spec; MinIO was provisioned but appears unused. Clarify if file storage is expected.
