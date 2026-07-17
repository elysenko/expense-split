# Test Specification

> **⚠️ Warning — `surface.json` is stale.** `.pipeline/surface.json` still contains the
> untouched scaffold template (only `GET /api/health` plus `Home`/`RootLayout` testids from
> `template-nextjs-fullstack`). It does **not** reflect the Express/Prisma API described in the
> approved spec. The API surface below is therefore derived from `requirements/spec.md` and the
> `.pipeline/tasks.md` "Surface contract". When the coder regenerates `surface.json`, re-run this
> spec to confirm coverage counts.
>
> **⚠️ Ambiguity — admin surface.** The spec body says "no admin surface since spec says plain
> users only," while `tasks.md` (following pipeline `full_auth` rules) adds `UserRole { ADMIN USER }`,
> first-signup-is-ADMIN, an `(admin)` guard, and `/api/admin/settings`. This spec covers the admin
> surface as described in `tasks.md`; if the reviewer resolves the ambiguity toward "no admin," the
> admin cases become Out of scope.

## Coverage summary
- Total cases: 74
- API endpoints covered: 19 / 19 (derived surface; `surface.json` lists only 1)
- User journeys covered: 12

### Derived endpoint inventory (19)
1. `POST /api/auth/signup`
2. `POST /api/auth/login`
3. `GET /api/auth/me`
4. `POST /api/households`
5. `POST /api/households/join`
6. `GET /api/households`
7. `GET /api/households/:id`
8. `GET /api/households/:id/members`
9. `GET /api/households/:id/expenses`
10. `POST /api/households/:id/expenses`
11. `GET /api/expenses/:id`
12. `POST /api/households/:id/settlements`
13. `GET /api/households/:id/settlements`
14. `GET /api/households/:id/balances`
15. `GET /api/health`
16. `GET /api/health/deep`
17. `GET /api/admin/settings`
18. `PATCH /api/admin/settings`
19. `GET /` SPA fallback (non-`/api` catch-all → `index.html`)

## API tests

### `POST /api/auth/signup`
- **Happy path**: `{email:"a@x.com", password:"pw123456", name:"Al"}` → `201` (or `200`) with body `{token:<jwt string>, user:{id, email:"a@x.com", name:"Al", role}}`; `passwordHash` never present in response. First signup on an empty DB → `role: "ADMIN"`; a later signup → `role: "USER"`.
- **Validation failures**: missing/empty `email`, `password`, or `name` → `400`; malformed email (`"nope"`) → `400`; password shorter than the enforced minimum → `400`. Body carries a Zod error, not a stack trace.
- **Auth failures**: duplicate email (signup twice with `a@x.com`) → `409` (or `400`), no second user row created.
- **Idempotency / edge cases**: token returned is a verifiable HS256 JWT signed with `JWT_SECRET`; decoding yields the new user's id.

### `POST /api/auth/login`
- **Happy path**: correct `{email, password}` for an existing user → `200` `{token, user}`; token authenticates a subsequent `GET /api/auth/me`.
- **Validation failures**: missing `email` or `password` → `400`.
- **Auth failures**: wrong password → `401`; unknown email → `401`. Response must not disclose which field was wrong.
- **Idempotency / edge cases**: two sequential logins each return a usable token.

### `GET /api/auth/me`
- **Happy path**: valid `Authorization: Bearer <token>` → `200` `{id, email, name, role}` for the token's user; no `passwordHash`.
- **Auth failures**: no header → `401`; malformed header (`"Bearer"` with no token, or garbage) → `401`; expired/invalid-signature token → `401`.

### `POST /api/households`
- **Happy path**: authed `{name:"Flat 3B"}` → `201` `{id, name, joinCode}`; `joinCode` matches `^[A-Z0-9]{6}$`; creator is auto-added as a `Membership` (confirm via `GET /api/households/:id/members`).
- **Validation failures**: missing/empty `name` → `400`.
- **Auth failures**: no token → `401`.
- **Idempotency / edge cases**: creating two households yields two distinct unique `joinCode`s.

### `POST /api/households/join`
- **Happy path**: second authed user posts `{joinCode:"<code>"}` → `200`/`201` with membership; user now appears in that household's members and in their own `GET /api/households`.
- **Validation failures**: missing `joinCode` → `400`; unknown code → `404`.
- **Auth failures**: no token → `401`.
- **Idempotency / edge cases**: joining a household the user already belongs to → success without creating a duplicate `Membership` (respects `@@unique([userId, householdId])`); member count unchanged.

### `GET /api/households`
- **Happy path**: authed user who belongs to 2 households → `200` array of exactly those 2 (id, name); ordered for "most recently active" default selection.
- **Auth failures**: no token → `401`.
- **Idempotency / edge cases**: user in no household → `200` `[]` (drives onboarding).

### `GET /api/households/:id`
- **Happy path**: member requests own household → `200` `{id, name, joinCode, ...}`.
- **Auth failures**: no token → `401`; authed non-member → `403` (householdMember guard); unknown id → `404`.

### `GET /api/households/:id/members`
- **Happy path**: member → `200` array of `{userId, name, email}`; includes creator and any joined users; no `passwordHash`.
- **Auth failures**: no token → `401`; non-member → `403`.

### `GET /api/households/:id/expenses`
- **Happy path**: member → `200` array ordered by `createdAt desc`; each item includes `id, description, amountCents, payerId, createdAt`.
- **Validation failures**: `?from`/`?to` non-parseable date → `400` (or documented ignore); if strict, assert 400.
- **Auth failures**: no token → `401`; non-member → `403`.
- **Idempotency / edge cases**: filters compose — `?member=<uid>` returns only expenses where user is payer or share-holder (per implementation); `?from=&to=` bounds inclusive; empty result → `200 []`.

### `POST /api/households/:id/expenses`
- **Happy path**: `{description, amountCents:1000, payerId, memberIds:[3 members]}` → `201` expense with 3 `ExpenseShare` rows; shares `[334,333,333]` (remainder cents to earliest members) and **sum exactly to 1000**. Even split `amountCents:900` / 3 → `[300,300,300]`.
- **Validation failures**: `amountCents` ≤ 0 or non-integer → `400`; empty `description` → `400`; empty `memberIds` → `400`; `payerId` not in the household → `400`; a `memberId` not in the household → `400`.
- **Auth failures**: no token → `401`; non-member posting to the household → `403`.
- **Idempotency / edge cases**: 1-member split → single share equal to full amount; `amountCents:1` / 3 members → `[1,0,0]` summing to 1.

### `GET /api/expenses/:id`
- **Happy path**: member of the owning household → `200` `{expense:{...}, shares:[{userId, shareCents}]}`; shares sum to `amountCents`.
- **Auth failures**: no token → `401`; user not in the owning household → `403`; unknown id → `404`.

### `POST /api/households/:id/settlements`
- **Happy path**: `{fromUserId, toUserId, amountCents:500}` (both members) → `201` settlement; reflected in `GET .../settlements` and shifts pairwise balances.
- **Validation failures**: `amountCents` ≤ 0 → `400`; `fromUserId === toUserId` → `400`; from/to not household members → `400`.
- **Auth failures**: no token → `401`; non-member → `403`.

### `GET /api/households/:id/settlements`
- **Happy path**: member → `200` array of `{id, fromUserId, toUserId, amountCents, createdAt}`.
- **Auth failures**: no token → `401`; non-member → `403`.
- **Idempotency / edge cases**: none recorded → `200 []`.

### `GET /api/households/:id/balances`
- **Happy path**: member → `200` `{net:[{userId, netCents}], owes:[{fromUserId, toUserId, amountCents}]}`. After seeded/known expenses, **sum of all `netCents` == 0**; `owes` amounts are all positive and reconstruct the nets. Positive net = owed money; negative = owes.
- **Auth failures**: no token → `401`; non-member → `403`.
- **Idempotency / edge cases**: household with no expenses → all nets `0`, `owes: []`; after a settlement A→B, the A–B pairwise entry decreases by the settled amount (or clears).

### `GET /api/health`
- **Happy path**: unauthenticated `GET` → `200` `{status:"ok"}` (or equivalent). No auth required.
- **Edge cases**: responds even when DB is unavailable (liveness, not readiness).

### `GET /api/health/deep`
- **Happy path**: DB up → `200` after a successful `SELECT 1`.
- **Edge cases**: DB unreachable → non-200 (`503`), used by Colossus readiness checks.

### `GET /api/admin/settings`
- **Happy path**: ADMIN token → `200` list of service keys (`postgresql`, `minio`, `llm`) with **masked** values and a `configured` boolean per key.
- **Auth failures**: no token → `401`; USER (non-admin) token → `403`.

### `PATCH /api/admin/settings`
- **Happy path**: ADMIN `{postgresql:{...}}` upsert → `200`; a subsequent `GET` shows `configured:true` with masked value.
- **Validation failures**: unknown service key or malformed body → `400`.
- **Auth failures**: no token → `401`; USER token → `403`; verify the PATCH did not mutate any `SystemSetting` row when rejected.

### `GET /` SPA fallback
- **Happy path**: a non-`/api` GET (`/history`, `/expenses/xyz`) → `200` serving `index.html` so client routing can take over.
- **Idempotency / edge cases**: `/api/*` unknown path is **not** swallowed by the fallback — returns JSON `404`, confirming `/api` is matched before the catch-all.

## UI / journey tests

### Journey: Signup & onboarding
- **Steps**: visit `/signup` → fill name/email/password → submit.
- **Expected outcomes**: token persisted to `localStorage`; redirected into the app; a user belonging to no household lands on the onboarding/create-or-join view (not a blank dashboard).
- **Negative path**: duplicate email or short password → inline error shown, stays on `/signup`, no redirect.

### Journey: Login & guard redirect
- **Steps**: visit a guarded route (`/history`) while logged out → redirected to `/login` → enter valid creds → submit.
- **Expected outcomes**: `RequireAuth` bounced the unauthenticated visit to `/login`; after login, user reaches the app; refreshing keeps them authenticated (token from `localStorage`).
- **Negative path**: wrong password → error message, remains on `/login`; a stored-but-expired token that yields `401` from the API clears the token and redirects to `/login`.

### Journey: Create household
- **Steps**: from onboarding/settings, submit "Create household" with a name.
- **Expected outcomes**: navigates to `/households/:id` dashboard; `HouseholdSettings` shows a 6-char join code and the creator in the member list.
- **Negative path**: empty name → validation error, no household created.

### Journey: Join household by code
- **Steps**: as a second user, open `/settings`, enter the first household's join code, submit.
- **Expected outcomes**: user is added; member list (both users) visible; the household appears in nav/switcher.
- **Negative path**: invalid code → "not found" error, membership unchanged.

### Journey: Add expense (modal route)
- **Steps**: on dashboard click "Add expense" → URL gains `?modal=add-expense` → fill description, amount, payer, member checkboxes → submit.
- **Expected outcomes**: modal closes (query param removed); new expense appears at top of `data-testid="expense-list"`; Balances panel updates.
- **Negative path**: amount ≤ 0 or no members selected → inline validation, modal stays open, nothing persisted.

### Journey: Dashboard & Balances
- **Steps**: log in as a seeded user with expenses → land on `/households/:id`.
- **Expected outcomes**: `data-testid="dashboard-main"` present; `<h2 data-testid="balances-heading">Balances</h2>` rendered; `data-testid="expense-list"` lists recent expenses; per-member net values shown.
- **Negative path**: household with no expenses → empty-state testids render (empty expense list + zeroed/empty balances), no crash.

### Journey: Settle up (modal route)
- **Steps**: click "Settle up" → URL gains `?modal=settle` → choose from/to/amount → submit.
- **Expected outcomes**: settlement recorded; Balances panel's affected pairwise entry decreases by the amount; settlement visible in history/settlements.
- **Negative path**: from == to, or amount ≤ 0 → validation error, modal stays open.

### Journey: History deep-linkable filters
- **Steps**: open `/history` → set member filter, `from`, and `to` → observe URL → copy URL → reload (or open in new tab).
- **Expected outcomes**: each filter change updates `?member=&from=&to=` via `useSearchParams`; on reload the params drive the query and the **same filtered result set** renders (no reset to unfiltered).
- **Negative path**: `from` later than `to` → empty result with a clear empty-state, no error page.

### Journey: Expense detail deep-link
- **Steps**: navigate directly to `/expenses/:id` (fresh load, not via in-app click).
- **Expected outcomes**: `ExpenseDetail` renders the expense with description, amount, payer, and per-member shares; SPA fallback served the route.
- **Negative path**: unknown/forbidden id → not-found or access message, not a blank page.

### Journey: Household settings
- **Steps**: open `/settings`.
- **Expected outcomes**: join code displayed (copyable), member list shown, create/join forms present and functional.
- **Negative path**: submitting join with a blank/invalid code → error, no navigation.

### Journey: Admin settings (admin-only)
- **Steps**: log in as the first (ADMIN) user → open `/admin/settings`.
- **Expected outcomes**: admin nav link visible only to ADMIN; page lists `postgresql`/`minio`/`llm` with configured/unconfigured badges and masked values; PATCH via a form succeeds and re-renders configured status.
- **Negative path**: a USER-role account sees no admin nav link and, visiting `/admin/settings` directly, is blocked (guarded/redirected); the API returns `403`.

### Journey: Mobile responsive dashboard (375px)
- **Steps**: set viewport to 375px wide → load dashboard as a seeded user.
- **Expected outcomes**: stacked/mobile nav and Balances section visible; `document.scrollingElement.scrollWidth <= clientWidth` (no horizontal scroll); required testids (`dashboard-main`, `balances-heading`, `expense-list`) present.
- **Negative path**: none — this is a layout invariant across pages (login, dashboard, history, settings should each avoid horizontal overflow at 375px).

## Data integrity tests
- After `POST .../expenses`: `sum(ExpenseShare.shareCents) == Expense.amountCents` for every expense (remainder distribution never drifts).
- Equal split assigns remainder cents to the earliest `memberIds` first; shares differ by at most 1 cent.
- Across any household at any time: `sum(balances.net.netCents) == 0`.
- `balances.owes` contains only positive amounts and no phantom debts — reconstructing nets from `owes` matches the computed `net` list (unit-test `computeBalances()` directly on fixtures of expenses + shares + settlements).
- A settlement A→B reduces A's debt to B by exactly `amountCents` (never creates a B→A phantom or over-corrects below zero into a new debt beyond real balances).
- `Membership` respects `@@unique([userId, householdId])` — re-joining does not duplicate rows.
- `User.email` and `Household.joinCode` uniqueness enforced at the DB layer (duplicate insert rejected).
- Seed idempotency: running the seed twice does not duplicate the demo household, users, or expenses.
- All monetary fields are integers (cents) end to end — no floats persisted or returned.

## Out of scope
- **Third-party integrations (minio, llm):** spec declares "Integrations: None"; these appear only as admin-settings credential keys with no feature behaviour, so no integration/round-trip tests are specified (open question in `tasks.md`).
- **Admin surface existence:** included per `tasks.md`, but the spec body says "no admin surface." If resolved toward the spec body, all `/api/admin/*` and `/admin/settings` cases drop out.
- **Password reset / email verification / logout-everywhere / token refresh:** spec describes only signup/login/me with a Bearer JWT; no such flows specified.
- **Rate limiting, CSRF, account lockout, password-strength policy beyond a minimum length:** not described in the spec.
- **Non-equal / percentage / itemized expense splits:** spec covers equal split only.
- **Multi-currency / currency formatting locale rules:** spec fixes storage to integer cents and does not specify display currency; only the cents invariant is tested.
- **Concurrency / race conditions** (simultaneous joins, double-submit expenses): not called out; only single-actor flows are specified.
- **Deployment/runtime (Docker multi-stage build, `prisma migrate deploy`, static SPA serving in the container):** validated operationally, not via app test cases here — except the `/api/health/deep` DB check and the `/api` vs SPA-fallback ordering, which are covered above.
