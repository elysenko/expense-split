# Architecture

## Stack
Requested stack (platform-fixed): `nextjs-fullstack`. This overrides the technology
choices named in the original plan (Express/Prisma backend + separate React SPA
frontend) — the plan's **features** (roommate expense splitting: auth, households,
expenses, balances, settle-up, history filters) must be implemented on top of this
Next.js 15 App Router monolith instead.

## Status
- Repo was empty (only `.git`, `.github/`, `README.md`) before this run.
- Verdict: **GREENFIELD** — scaffolded from scratch.
- Platform: `nextjs-fullstack` — ✅ newly scaffolded from `template-nextjs-fullstack`.

## Layout
Single Next.js app at the project root (no subdirectory split):
- `app/` — App Router pages and API routes. `app/page.tsx` is the placeholder
  home page (`data-testid="home-main"` / `"home-title"`) — replace with the real
  UI. `app/layout.tsx` is the root layout. `app/api/health/route.ts` is the
  health check (`GET /api/health`).
- `lib/auth.ts` — JWT session helpers (`signToken` / `verifyToken`, HS256, reads
  `JWT_SECRET`). API routes should verify the bearer token via `verifyToken()`.
- `prisma/schema.prisma` — starter `User` model (id, email, name, role, password,
  createdAt) + `Role` enum. Extend with the app's domain models (Household,
  Membership, Expense, ExpenseShare, Settlement per the plan) and run
  `npx prisma migrate dev` to generate a migration.
- `prisma/seed.ts` — demo seed; prints `SEED_CRED`/`SEED_CREDS_JSON` lines to
  stdout (Colossus deploy activity parses this to populate demo credentials).
  Extend with the plan's demo household/members/expenses, keeping the
  `SEED_CRED`/`SEED_CREDS_JSON` stdout contract intact.
- `public/` — static assets.
- `Dockerfile` — multi-stage build using Next's `standalone` output
  (`next.config.mjs` sets `output: 'standalone'`); runtime image runs the built
  standalone server. Add `prisma migrate deploy` + conditional seeding to the
  runtime entrypoint before `node server.js` when wiring deploy.
- `.pipeline/surface.json` — machine-readable manifest of routes, components,
  and `data-testid`s (currently reflects only the scaffolded stub). The coder
  must keep this in sync as routes/components/testids are added — it is the
  contract used by the test_spec agent and Playwright test generator.
- `.colossus-acceptance.json` — post-deploy render-gate contract. Seeded with
  `ready_testid: "home-main"` and reject signatures matching the untouched stub
  page; the coder must update `expect_text` (and may need to change
  `ready_testid`) once the real front page exists.
- `colossus.yaml` — build manifest for deploy agents (`framework: nextjs`,
  standalone `outputDir: .next`, port 3000, no nginx — Next serves everything
  itself, including what would otherwise be separate API routes).

## Next steps for the developer
1. Fill in domain models in `prisma/schema.prisma` per the plan (Household,
   Membership, Expense, ExpenseShare, Settlement — money as integer cents) and
   run `npx prisma migrate dev --name init`.
2. Implement API routes under `app/api/**/route.ts` for auth, households,
   expenses, settlements, and balances (equivalent to the plan's Express
   routers, but as Next.js route handlers).
3. Build the UI as App Router pages/components under `app/` (dashboard,
   history, household settings, expense detail, add-expense/settle-up flows)
   instead of a separate React Router SPA.
4. Copy `.env.example` to `.env` (already done by the scaffolder) and fill in
   real `DATABASE_URL` / `JWT_SECRET` for local dev.
5. Run `npx prisma generate` and `npm install` before first `npm run dev`.
6. Extend `prisma/seed.ts` with the plan's demo household/members/expenses.
7. Update `.pipeline/surface.json` and `.colossus-acceptance.json` as real
   routes, components, and testids are added — do not leave them pointing at
   the stub page.

## Template source
`template-nextjs-fullstack` from the scaffold-templates library.
