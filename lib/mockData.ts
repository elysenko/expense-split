// Self-contained mock data for the frontend mockup preview. Pure TypeScript,
// no DB dependency, so server components render during the static preview build.
// The coder replaces these reads with Prisma queries + lib/balances.ts.

export interface Member {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export interface Expense {
  id: string;
  description: string;
  amountCents: number;
  payerId: string;
  createdAt: string; // ISO date
  memberIds: string[]; // who splits it
}

export interface Settlement {
  id: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  createdAt: string;
}

export const HOUSEHOLD = {
  id: 'hh_1',
  name: 'Maple Street Apartment',
  joinCode: 'MAPLE-4827',
};

export const MEMBERS: Member[] = [
  { id: 'u_alex', name: 'Alex Rivera', email: 'alex@example.com', initials: 'AR' },
  { id: 'u_sam', name: 'Sam Chen', email: 'sam@example.com', initials: 'SC' },
  { id: 'u_jordan', name: 'Jordan Lee', email: 'jordan@example.com', initials: 'JL' },
];

// The signed-in demo user for the mockup.
export const CURRENT_USER_ID = 'u_alex';

const allIds = MEMBERS.map((m) => m.id);

export const EXPENSES: Expense[] = [
  { id: 'e_1', description: 'Groceries — Costco run', amountCents: 14237, payerId: 'u_alex', createdAt: '2026-07-15', memberIds: allIds },
  { id: 'e_2', description: 'Electricity bill (June)', amountCents: 9840, payerId: 'u_sam', createdAt: '2026-07-14', memberIds: allIds },
  { id: 'e_3', description: 'Internet — Fiber plan', amountCents: 7000, payerId: 'u_jordan', createdAt: '2026-07-12', memberIds: allIds },
  { id: 'e_4', description: 'Dish soap & paper towels', amountCents: 2355, payerId: 'u_alex', createdAt: '2026-07-11', memberIds: allIds },
  { id: 'e_5', description: 'Pizza night', amountCents: 4800, payerId: 'u_sam', createdAt: '2026-07-09', memberIds: allIds },
  { id: 'e_6', description: 'Water & sewer', amountCents: 5120, payerId: 'u_jordan', createdAt: '2026-07-07', memberIds: allIds },
  { id: 'e_7', description: 'Cleaning supplies', amountCents: 3199, payerId: 'u_alex', createdAt: '2026-07-05', memberIds: allIds },
  { id: 'e_8', description: 'Streaming subscription', amountCents: 1999, payerId: 'u_sam', createdAt: '2026-07-03', memberIds: allIds },
  { id: 'e_9', description: 'New shower curtain', amountCents: 2650, payerId: 'u_jordan', createdAt: '2026-07-02', memberIds: ['u_alex', 'u_jordan'] },
  { id: 'e_10', description: 'Coffee beans (bulk)', amountCents: 3400, payerId: 'u_alex', createdAt: '2026-07-01', memberIds: allIds },
];

export const SETTLEMENTS: Settlement[] = [
  { id: 's_1', fromUserId: 'u_jordan', toUserId: 'u_alex', amountCents: 3000, createdAt: '2026-07-13' },
];

// ---- helpers ----

export function memberById(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}

export function memberName(id: string): string {
  return memberById(id)?.name ?? 'Unknown';
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// equalSplit mirrors lib/balances.ts: remainder cents go to the first members.
export function equalSplit(amountCents: number, memberIds: string[]): Record<string, number> {
  const n = memberIds.length;
  const base = Math.floor(amountCents / n);
  let remainder = amountCents - base * n;
  const shares: Record<string, number> = {};
  for (const id of memberIds) {
    shares[id] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
  }
  return shares;
}

export interface Pairwise {
  fromId: string;
  toId: string;
  amountCents: number;
}

export interface Balances {
  net: Record<string, number>; // positive = owed to member, negative = member owes
  pairwise: Pairwise[];
}

export function computeBalances(
  expenses: Expense[],
  settlements: Settlement[],
  members: Member[],
): Balances {
  const net: Record<string, number> = {};
  for (const m of members) net[m.id] = 0;

  for (const e of expenses) {
    const shares = equalSplit(e.amountCents, e.memberIds);
    net[e.payerId] = (net[e.payerId] ?? 0) + e.amountCents;
    for (const [id, share] of Object.entries(shares)) {
      net[id] = (net[id] ?? 0) - share;
    }
  }

  for (const s of settlements) {
    // from paid to -> reduces from's debt, reduces to's credit
    net[s.fromUserId] = (net[s.fromUserId] ?? 0) + s.amountCents;
    net[s.toUserId] = (net[s.toUserId] ?? 0) - s.amountCents;
  }

  // Greedy pairwise settle-up suggestion
  const debtors = members
    .map((m) => ({ id: m.id, amt: net[m.id] }))
    .filter((x) => x.amt < 0)
    .map((x) => ({ id: x.id, amt: -x.amt }))
    .sort((a, b) => b.amt - a.amt);
  const creditors = members
    .map((m) => ({ id: m.id, amt: net[m.id] }))
    .filter((x) => x.amt > 0)
    .sort((a, b) => b.amt - a.amt);

  const pairwise: Pairwise[] = [];
  let di = 0;
  let ci = 0;
  const d = debtors.map((x) => ({ ...x }));
  const c = creditors.map((x) => ({ ...x }));
  while (di < d.length && ci < c.length) {
    const pay = Math.min(d[di].amt, c[ci].amt);
    if (pay > 0) {
      pairwise.push({ fromId: d[di].id, toId: c[ci].id, amountCents: pay });
    }
    d[di].amt -= pay;
    c[ci].amt -= pay;
    if (d[di].amt === 0) di += 1;
    if (c[ci].amt === 0) ci += 1;
  }

  return { net, pairwise };
}
