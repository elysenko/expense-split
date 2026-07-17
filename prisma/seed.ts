// Seed contract (Colossus): every seeded demo credential MUST be printed as a
// `SEED_CRED <ROLE> <email> <password>` line (or a single SEED_CREDS_JSON line) —
// the deploy activity sync_seed_credentials parses stdout to populate
// deployments.appDemoCredentials. Keep these lines when extending this seed.
import { PrismaClient, Role } from '@prisma/client';
import { createHash } from 'crypto';
import { hashPassword } from '../lib/auth';
import { equalSplit } from '../lib/balances';

const prisma = new PrismaClient();

// Deterministic per-email demo password so re-seeding yields stable creds.
function derivePassword(email: string): string {
  return createHash('sha256')
    .update(email + (process.env.SEED_SECRET || 'colossus-seed'))
    .digest('hex')
    .slice(0, 16);
}

const HOUSEHOLD = { name: 'Maple Street Apartment', joinCode: 'MAPLE-4827' };

const SEED_USERS: Array<{ email: string; name: string; role: Role; inHousehold: boolean }> = [
  { email: 'admin@example.com', name: 'Admin User', role: Role.ADMIN, inHousehold: false },
  { email: 'alex@example.com', name: 'Alex Rivera', role: Role.USER, inHousehold: true },
  { email: 'sam@example.com', name: 'Sam Chen', role: Role.USER, inHousehold: true },
  { email: 'jordan@example.com', name: 'Jordan Lee', role: Role.USER, inHousehold: true },
];

// daysAgo spreads seeded expenses across a realistic recent window.
const EXPENSES: Array<{ description: string; amountCents: number; payer: string; splitAll: boolean; daysAgo: number }> = [
  { description: 'Groceries — Costco run', amountCents: 14237, payer: 'alex@example.com', splitAll: true, daysAgo: 2 },
  { description: 'Electricity bill (June)', amountCents: 9840, payer: 'sam@example.com', splitAll: true, daysAgo: 3 },
  { description: 'Internet — Fiber plan', amountCents: 7000, payer: 'jordan@example.com', splitAll: true, daysAgo: 5 },
  { description: 'Dish soap & paper towels', amountCents: 2355, payer: 'alex@example.com', splitAll: true, daysAgo: 6 },
  { description: 'Pizza night', amountCents: 4800, payer: 'sam@example.com', splitAll: true, daysAgo: 8 },
  { description: 'Water & sewer', amountCents: 5120, payer: 'jordan@example.com', splitAll: true, daysAgo: 10 },
  { description: 'Cleaning supplies', amountCents: 3199, payer: 'alex@example.com', splitAll: true, daysAgo: 12 },
  { description: 'Streaming subscription', amountCents: 1999, payer: 'sam@example.com', splitAll: true, daysAgo: 14 },
  { description: 'New shower curtain', amountCents: 2650, payer: 'jordan@example.com', splitAll: false, daysAgo: 15 },
  { description: 'Coffee beans (bulk)', amountCents: 3400, payer: 'alex@example.com', splitAll: true, daysAgo: 16 },
];

function daysAgoDate(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main(): Promise<void> {
  const creds: Array<{ role: string; email: string; password: string }> = [];
  const idByEmail = new Map<string, string>();

  for (const u of SEED_USERS) {
    const password = derivePassword(u.email);
    const hashed = await hashPassword(password);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: hashed },
      create: { email: u.email, name: u.name, role: u.role, password: hashed },
    });
    idByEmail.set(u.email, user.id);
    console.log(`SEED_CRED ${u.role} ${u.email} ${password}`);
    creds.push({ role: u.role, email: u.email, password });
  }

  // Household + memberships
  const household = await prisma.household.upsert({
    where: { joinCode: HOUSEHOLD.joinCode },
    update: { name: HOUSEHOLD.name },
    create: { name: HOUSEHOLD.name, joinCode: HOUSEHOLD.joinCode },
  });

  const householdMembers = SEED_USERS.filter((u) => u.inHousehold).map((u) => idByEmail.get(u.email)!);
  for (const userId of householdMembers) {
    await prisma.membership.upsert({
      where: { userId_householdId: { userId, householdId: household.id } },
      update: {},
      create: { userId, householdId: household.id },
    });
  }

  // Reset the ledger so re-seeding is deterministic.
  await prisma.settlement.deleteMany({ where: { householdId: household.id } });
  await prisma.expense.deleteMany({ where: { householdId: household.id } });

  const twoWay = [idByEmail.get('alex@example.com')!, idByEmail.get('jordan@example.com')!];
  for (const e of EXPENSES) {
    const memberIds = e.splitAll ? householdMembers : twoWay;
    const shares = equalSplit(e.amountCents, memberIds);
    await prisma.expense.create({
      data: {
        householdId: household.id,
        description: e.description,
        amountCents: e.amountCents,
        payerId: idByEmail.get(e.payer)!,
        createdAt: daysAgoDate(e.daysAgo),
        shares: { create: memberIds.map((userId) => ({ userId, shareCents: shares[userId] })) },
      },
    });
  }

  // One settlement: Jordan pays Alex back $30.
  await prisma.settlement.create({
    data: {
      householdId: household.id,
      fromUserId: idByEmail.get('jordan@example.com')!,
      toUserId: idByEmail.get('alex@example.com')!,
      amountCents: 3000,
      createdAt: daysAgoDate(4),
    },
  });

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
