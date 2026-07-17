# Test Specification

> **Warning — stale `surface.json`.** At authoring time `.pipeline/surface.json` still holds
> only the scaffold stub (`GET /api/health`, `Home`/`RootLayout`). The endpoint list below is
> therefore derived from the spec's *Surface contract* in `.pipeline/tasks.md` and the
> Implementation Plan. When the coder regenerates `surface.json`, re-verify that every route and
> `data-testid` here still matches, and reconcile any drift before the E2E gate runs.
>
> **Open questions that affect scope** (from `tasks.md`): the auth model conflict
> (first-signup-`ADMIN` per `full_auth` vs. all-`USER` per the spec's Assumptions), and whether the
> admin-settings surface (`/admin/*`, `SystemSetting`, MinIO) is actually in scope. Admin-related
> cases below are marked **[conditional — admin surface]** and should only be run if the pipeline
> confirms the admin surface ships. Core roommate-splitter behaviour does not depend on them.

## Coverage summary
- Total cases: 63
- API endpoints covered: 13 / 13 (from `tasks.md` surface contract; `surface.json` lists only 1)
- User journeys covered: 12

## API tests

### `POST /api/auth/signup`
- **Happy path**: `{ email: "new@x.com", password: "hunter2xy" }` → `200/201`, JSON body `{ next: "/onboarding" }` (no household yet), `Set-Cookie: session=<jwt>; HttpOnly; SameSite=Lax` present. New `User` row exists; password stored as a bcrypt hash (never plaintext).
- **Validation failures**:
  - Missing/empty email → `400`, JSON error, no user created.
  - Malformed email (`"notanemail"`) → `400`.
  - Missing/too-short password (e.g. empty or `< min` length) → `400`.
- **Auth failures**: Duplicate email (already registered) → `409` (or `400`) with error message; no second user created; no cookie set.
- **Idempotency / edge cases**: First-ever signup role assignment — **[conditional — admin surface]** if `full_auth` wins, first user gets `role=ADMIN`, subsequent users `USER`; if the spec's "plain users only" wins, all users get `USER`. Assert whichever the reconciled decision dictates.

### `POST /api/auth/login`
- **Happy path**: valid credentials of an existing user → `200`, `Set-Cookie: session` (HttpOnly, SameSite=Lax), body includes next target (`/dashboard` if the user has a household, else `/onboarding`).
- **Validation failures**: missing email or password → `400`.
- **Auth failures**:
  - Unknown email → `401`, no cookie.
  - Wrong password for a known email → `401`, no cookie.
  - Error message must not reveal which field was wrong (no user-enumeration leak).
- **Idempotency / edge cases**: seeded credentials (from `SEED_CREDS_JSON`) authenticate successfully and return `next: "/dashboard"`.

### `POST /api/auth/logout`
- **Happy path**: authenticated request → `200`, `Set-Cookie: session=; Max-Age=0` (cookie cleared/expired). Subsequent guarded API call with the old cookie is rejected.
- **Edge cases**: logout with no session cookie → still `200` (idempotent), clears nothing harmful.

### `POST /api/households`
- **Happy path**: authenticated user with no household, `{ name: "Flat 3B" }` → `200/201`, body `{ joinCode: <string>, householdId }`. A `Household` + a `Membership` for the caller are created; `joinCode` is unique.
- **Validation failures**: missing/empty `name` → `400`, no household created.
- **Auth failures**: no session cookie → `401`, no household created.
- **Idempotency / edge cases**: two households created back-to-back get distinct `joinCode`s (uniqueness). Per v1 "one active household" rule, behaviour for a user who already has a membership is defined (either `400`/`409` or returns existing) — assert the implemented contract.

### `POST /api/households/join`
- **Happy path**: authenticated user, `{ joinCode: <valid code> }` → `200`, a `Membership` linking caller↔household is created; caller now resolves to that household.
- **Validation failures**: missing `joinCode` → `400`.
- **Auth failures**:
  - No session → `401`.
  - Unknown/invalid `joinCode` → `404` (or `400`), no membership created.
- **Idempotency / edge cases**: joining a household the user already belongs to does not create a duplicate `Membership` (respects `@@unique([userId, householdId])`) — returns `409`/`200` without duplication.

### `GET /api/expenses`
- **Happy path**: authenticated member with no filters → `200`, JSON array of the caller's household expenses only (scoped; never another household's rows), each with `id`, `description`, `amountCents`, `payerId`, `createdAt`.
- **Validation failures**: malformed `from`/`to` date params → `400` (or ignored per contract — assert whichever is implemented, consistently).
- **Auth failures**: no session → `401`; authenticated user without a household → `403`/empty per contract.
- **Idempotency / edge cases (filters)**:
  - `?member=<userId>` → only expenses where that member is payer or shareholder (per implemented filter semantics), all within the household.
  - `?from=YYYY-MM-DD&to=YYYY-MM-DD` → only expenses with `createdAt` in range (inclusive bounds asserted).
  - Combined `member` + `from` + `to` → intersection of all filters.

### `POST /api/expenses`
- **Happy path**: `{ description: "Groceries", amountCents: 3000, payerId, memberIds: [a,b,c] }` → `200/201`. Creates one `Expense` and one `ExpenseShare` per member **in a single transaction**; `shareCents` values sum **exactly** to `3000` (equal split `1000/1000/1000`).
- **Validation failures**:
  - Missing/empty `description` → `400`.
  - `amountCents` ≤ 0 or non-integer → `400`.
  - Empty `memberIds` → `400`.
  - `payerId` or a `memberId` not in the caller's household → `400`/`403`; no partial write (transaction rolls back — no orphan `Expense` without shares).
- **Auth failures**: no session → `401`; member of a *different* household attempting to post to this household → `403`.
- **Idempotency / edge cases (remainder cents)**: `amountCents: 100, memberIds: [a,b,c]` → shares `34/33/33` (remainder cent to the first member), summing to `100`. No cent lost or duplicated.

### `GET /api/expenses/[id]`
- **Happy path**: authenticated member requests an expense in their household → `200`, body with `description`, `amountCents`, `payer`, and per-member `shares[]` (each `userId` + `shareCents`).
- **Auth failures**:
  - No session → `401`.
  - Expense belongs to a household the caller is not a member of → `403`/`404` (must not leak another household's data).
- **Idempotency / edge cases**: unknown `id` → `404`.

### `POST /api/settlements`
- **Happy path**: `{ fromUserId, toUserId, amountCents: 500 }` both members of caller's household → `200/201`, a `Settlement` row created. Recomputed balances show the from→to pairwise owed amount reduced by exactly `500`.
- **Validation failures**:
  - `amountCents` ≤ 0 or non-integer → `400`.
  - `fromUserId === toUserId` → `400`.
  - `fromUserId`/`toUserId` missing → `400`.
- **Auth failures**: no session → `401`; either party not a member of the caller's household → `403`, no settlement created.
- **Idempotency / edge cases**: settlement larger than the current owed amount is accepted and flips the pairwise direction (or is capped) — assert the implemented `computeBalances` contract.

### `GET /api/admin/settings` — **[conditional — admin surface]**
- **Happy path**: admin session → `200`, lists service keys (`postgresql`, `minio`) with **masked** values and a configured/unconfigured status flag; secrets never returned in cleartext.
- **Auth failures**: no session → `401`; authenticated non-admin (`role=USER`) → `403`.

### `PATCH /api/admin/settings` — **[conditional — admin surface]**
- **Happy path**: admin session, `{ minio: "..." }` → `200`, upserts the `SystemSetting` row; subsequent `GET` reports it configured (masked).
- **Validation failures**: unknown key or malformed body → `400`.
- **Auth failures**: non-admin `USER` session → `403`, no write performed (assert `tasks.md` "admin-only PATCH rejects non-admins").

### `GET /api/health`
- **Happy path**: unauthenticated `GET` → `200`, health JSON. Confirms the one public API route in `surface.json` remains reachable without a session.

## UI / journey tests

### Journey: Sign up → onboarding
- **Steps**: navigate `/signup`; type email + password into the `SignupForm` inputs (by `data-testid`); submit.
- **Expected outcomes**: `session` cookie set; redirected to `/onboarding` (new user has no household); onboarding create/join forms visible.
- **Negative path**: submit a duplicate email → inline error rendered in the form; stays on `/signup`; no redirect.

### Journey: Log in (manual + seeded creds)
- **Steps**: navigate `/login`; enter valid credentials; submit. Repeat using the seeded credentials emitted in `SEED_CREDS_JSON`.
- **Expected outcomes**: redirected to `/dashboard` (user with household) showing seeded expenses and Balances; `dashboard-main` present.
- **Negative path**: wrong password → inline error, no redirect, no cookie.

### Journey: Unauthenticated access is guarded
- **Steps**: with no session cookie, request `/dashboard`, `/history`, `/settings`, `/expenses/[id]`.
- **Expected outcomes**: each redirects to `/login` (server guard in `(app)/layout.tsx`).
- **Negative path**: authenticated user **without a household** hitting `/dashboard` → redirected to `/onboarding`.

### Journey: Create a household
- **Steps**: on `/onboarding`, fill the create-household form with a name; submit.
- **Expected outcomes**: household created; the join-code is displayed on-screen (copyable); navigable to `/dashboard`; dashboard renders (empty state acceptable for a fresh household).
- **Negative path**: empty name → inline validation error, no household created.

### Journey: Join a household by code
- **Steps**: as a second (new) user on `/onboarding`, enter the join-code from the created household; submit.
- **Expected outcomes**: membership created; redirected into the app; dashboard shows that household's shared data.
- **Negative path**: invalid code → inline error; user remains on `/onboarding`.

### Journey: Dashboard shows balances + recent expenses
- **Steps**: log in as a seeded member; land on `/dashboard`.
- **Expected outcomes**: `main[data-testid="dashboard-main"]` present; `BalancesSection` heading with `data-testid="balances-heading"` and literal text `Balances` present; `ExpenseList` (`data-testid="expense-list"`) lists recent expenses; pairwise balances render as `X owes Y $Z`.
- **Negative path**: a household with zero expenses shows `data-testid="expenses-empty"` empty state instead of a populated list.

### Journey: Add an expense (URL-addressable modal)
- **Steps**: from `/dashboard`, open `/dashboard?modal=add-expense`; fill description, amount in **dollars**, select payer, check member checkboxes; submit.
- **Expected outcomes**: dollars converted to cents; `POST /api/expenses` succeeds; `router.refresh()` re-renders; the new expense appears in `expense-list`; modal closes when the `modal` param is cleared. Deep-linking directly to `?modal=add-expense` opens the modal.
- **Negative path**: submit with no members selected or amount `0` → inline validation error; no expense created.

### Journey: Settle up (URL-addressable modal)
- **Steps**: open `/dashboard?modal=settle`; pick from-member, to-member, amount; submit.
- **Expected outcomes**: `POST /api/settlements` succeeds; after refresh, the pairwise balance between those members is reduced by the settled amount in `BalancesSection`.
- **Negative path**: from === to, or amount `0` → inline validation error; no settlement created.

### Journey: History filters are URL-driven and reproducible
- **Steps**: go to `/history`; use `HistoryFilters` to select a member and a date range.
- **Expected outcomes**: URL query string updates to reflect `member`/`from`/`to`; the list narrows to matching expenses; **reloading the URL reproduces the exact filtered view** (server reads `searchParams`); each row links to `/expenses/[id]`.
- **Negative path**: a filter combination matching nothing shows the empty state; clearing filters restores the full list.

### Journey: Expense detail
- **Steps**: from `/history` (or dashboard), click an expense row to `/expenses/[id]`.
- **Expected outcomes**: detail page shows description, formatted amount, payer, and each member's share; shares sum to the total.
- **Negative path**: navigating to an expense id outside the caller's household → not found / not authorized (no cross-household leak).

### Journey: Settings
- **Steps**: navigate `/settings`.
- **Expected outcomes**: household name, the join-code (copyable), and the member list are shown; server-rendered and membership-authorized.
- **Negative path**: unauthenticated access redirects to `/login`.

### Journey: Mobile usability at 375px
- **Steps**: render `/dashboard` at a 375px-wide viewport as a logged-in member.
- **Expected outcomes**: `Nav` visible/usable, Balances section visible, no horizontal scroll (document scrollWidth ≤ viewport width); content reflows rather than overflowing.
- **Negative path**: n/a (regression assertion).

### Journey: Admin settings — **[conditional — admin surface]**
- **Steps**: log in as an admin; open `/admin/settings`.
- **Expected outcomes**: each provisioned service (`postgresql`, `minio`) shown with a configured/unconfigured badge and a credential form wired to `GET/PATCH /api/admin/settings`; saved values read back masked.
- **Negative path**: a non-admin `USER` navigating to `/admin/settings` is denied (redirect/403); the admin link is hidden from `Nav` for non-admins.

## Data integrity tests
- After `POST /api/expenses`: exactly one `Expense` and one `ExpenseShare` per selected member exist, and `Σ shareCents === amountCents` (holds for even splits and remainder-cent splits). No `Expense` persists without its shares (transaction atomicity).
- Money is stored as integer cents everywhere — no floating-point columns; UI dollar inputs are converted to integer cents before persistence.
- `Membership` respects `@@unique([userId, householdId])`: no duplicate memberships from repeated joins.
- `Household.joinCode` is unique across all households.
- All queries are household-scoped: an expense/settlement/detail request never returns rows from a household the caller is not a member of.
- `computeBalances(expenses, settlements)`: per-member net = Σ(paid) − Σ(own shares); applying a from→to `Settlement` reduces that pair's owed amount by exactly the settlement amount; the sum of all member nets across the household is `0` (conserved).
- Passwords persist only as bcrypt hashes; the seed and the app share one `hashPassword` helper so seeded credentials authenticate through the live `verifyPassword` path.
- Seed run: `npx prisma db seed` emits `SEED_CRED`/`SEED_CREDS_JSON` on stdout, creates a 3-member household with ~10 equal-split expenses and 1 settlement, and those credentials authenticate.

## Out of scope
- **Third-party integrations** — spec `## Integrations` is "None"; no integration client modules or external-service tests.
- **File uploads / receipts / MinIO storage** — not described in the spec (open question in `tasks.md`); MinIO is provisioned but unused. Not tested unless the admin-surface open question resolves to include it.
- **Multi-household per user** — deferred to post-v1 ("one active household per user"); switching/multiple active households is not tested.
- **Admin surface** (`/admin/login`, `/admin/settings`, `SystemSetting`, `lib/config.ts`) — the spec's Assumptions state "No admin role used (plain users only)". Cases above are marked **[conditional — admin surface]** and are only exercised if the pipeline reconciles the open question in favour of shipping the `full_auth` admin surface.
- **Password reset / email verification / OAuth** — not in the spec.
- **Expense edit/delete and settlement reversal** — spec only defines create + read for expenses and create for settlements; mutation of existing rows is not in scope.
- **Concurrency/load and rate-limiting** — the spec is silent; not tested.

Wrote .pipeline/test_spec.md (63 cases across 13 endpoints / 12 journeys).
