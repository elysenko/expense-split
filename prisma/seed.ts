// Seed contract (Colossus): every seeded demo credential MUST be printed as a
// `SEED_CRED <ROLE> <email> <password>` line (or a single SEED_CREDS_JSON line) —
// the deploy activity sync_seed_credentials parses stdout to populate
// deployments.appDemoCredentials. Keep these lines when extending this seed.
//
// This seed is idempotent: users are upserted, the demo household is upserted by
// its stable joinCode, memberships are upserted on their compound unique key, and
// the demo household's expenses/settlements are cleared and rebuilt on every run
// so re-running the container never duplicates demo data.
import { PrismaClient, Role } from '@prisma/client';
import { createHash } from 'crypto';
import { splitShares } from '../lib/balances';

const prisma = new PrismaClient();

// Deterministic password derived from email — identical across runs so the
// captured SEED_CREDS_JSON always authenticates against the stored hash.
function derivePassword(email: string): string {
  return createHash('sha256')
    .update(email + (process.env.SEED_SECRET || 'colossus-seed'))
    .digest('hex')
    .slice(0, 16);
}

// SHA-256 hex — MUST match lib/auth.ts hashPassword so seeded users can log in.
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

const SEED_USERS: Array<{ email: string; name: string; role: Role }> = [
  { email: 'admin@example.com', name: 'Alex Rivera', role: Role.ADMIN },
  { email: 'user@example.com', name: 'Jordan Lee', role: Role.USER },
  { email: 'roomie@example.com', name: 'Sam Patel', role: Role.USER },
];

const DEMO_HOUSEHOLD = { name: 'Maple Street Apt', joinCode: 'MAPLE1' };

// Fixed demo expenses. `payer` and `members` reference SEED_USERS by email so
// shares are computed with the real equal-split logic (splitShares).
const DEMO_EXPENSES: Array<{
  description: string;
  amountCents: number;
  payer: string;
  members: string[];
}> = [
  { description: 'Groceries — Costco run', amountCents: 12480, payer: 'admin@example.com', members: ['admin@example.com', 'user@example.com', 'roomie@example.com'] },
  { description: 'Internet (July)', amountCents: 6000, payer: 'user@example.com', members: ['admin@example.com', 'user@example.com', 'roomie@example.com'] },
  { description: 'Electricity bill', amountCents: 8734, payer: 'roomie@example.com', members: ['admin@example.com', 'user@example.com', 'roomie@example.com'] },
  { description: 'Dish soap & paper towels', amountCents: 2399, payer: 'admin@example.com', members: ['admin@example.com', 'user@example.com', 'roomie@example.com'] },
  { description: 'Pizza night', amountCents: 4550, payer: 'user@example.com', members: ['admin@example.com', 'user@example.com', 'roomie@example.com'] },
  { description: 'Streaming subscription', amountCents: 1599, payer: 'roomie@example.com', members: ['admin@example.com', 'user@example.com', 'roomie@example.com'] },
  { description: 'Cleaning supplies', amountCents: 3320, payer: 'admin@example.com', members: ['admin@example.com', 'roomie@example.com'] },
  { description: 'Water bill', amountCents: 4210, payer: 'user@example.com', members: ['admin@example.com', 'user@example.com', 'roomie@example.com'] },
  { description: 'New shower curtain', amountCents: 1875, payer: 'roomie@example.com', members: ['user@example.com', 'roomie@example.com'] },
  { description: 'Coffee beans (bulk)', amountCents: 2700, payer: 'admin@example.com', members: ['admin@example.com', 'user@example.com', 'roomie@example.com'] },
];

const DEMO_SETTLEMENTS: Array<{ from: string; to: string; amountCents: number }> = [
  { from: 'user@example.com', to: 'admin@example.com', amountCents: 2000 },
  { from: 'roomie@example.com', to: 'user@example.com', amountCents: 1500 },
];

async function main(): Promise<void> {
  const creds: Array<{ role: string; email: string; password: string }> = [];
  const idByEmail: Record<string, string> = {};

  // 1) Users — upsert; re-assert password + role on every run.
  for (const u of SEED_USERS) {
    const password = derivePassword(u.email);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: hashPassword(password) },
      create: { email: u.email, name: u.name, role: u.role, password: hashPassword(password) },
    });
    idByEmail[u.email] = user.id;
    console.log(`SEED_CRED ${u.role} ${u.email} ${password}`);
    creds.push({ role: u.role, email: u.email, password });
  }

  // 2) Demo household — upsert by stable joinCode so it is never duplicated.
  const household = await prisma.household.upsert({
    where: { joinCode: DEMO_HOUSEHOLD.joinCode },
    update: { name: DEMO_HOUSEHOLD.name },
    create: DEMO_HOUSEHOLD,
  });

  // 3) Memberships — upsert every seed user into the demo household.
  for (const u of SEED_USERS) {
    const userId = idByEmail[u.email];
    await prisma.membership.upsert({
      where: { userId_householdId: { userId, householdId: household.id } },
      update: {},
      create: { userId, householdId: household.id },
    });
  }

  // 4) Rebuild expenses + settlements deterministically (idempotent).
  await prisma.settlement.deleteMany({ where: { householdId: household.id } });
  await prisma.expense.deleteMany({ where: { householdId: household.id } });

  for (const e of DEMO_EXPENSES) {
    const memberIds = e.members.map((m) => idByEmail[m]);
    const shares = splitShares(e.amountCents, memberIds);
    await prisma.expense.create({
      data: {
        householdId: household.id,
        description: e.description,
        amountCents: e.amountCents,
        payerId: idByEmail[e.payer],
        shares: {
          create: shares.map((s) => ({ userId: s.userId, shareCents: s.shareCents })),
        },
      },
    });
  }

  for (const s of DEMO_SETTLEMENTS) {
    await prisma.settlement.create({
      data: {
        householdId: household.id,
        fromUserId: idByEmail[s.from],
        toUserId: idByEmail[s.to],
        amountCents: s.amountCents,
      },
    });
  }

  console.log(
    `Seeded household "${household.name}" (code ${household.joinCode}) with ` +
      `${SEED_USERS.length} members, ${DEMO_EXPENSES.length} expenses, ${DEMO_SETTLEMENTS.length} settlements.`,
  );
  console.log(`SEED_CREDS_JSON ${JSON.stringify(creds)}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
