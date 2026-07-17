// Mock data + pure balance logic for the frontend preview. No backend is
// available in the mockup preview, so screens render from this in-memory model.
// The equal-split and greedy-netting logic mirrors the planned server behaviour.

export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Household {
  id: string;
  name: string;
  joinCode: string;
  memberIds: string[];
}

export interface Expense {
  id: string;
  householdId: string;
  description: string;
  amountCents: number;
  payerId: string;
  participantIds: string[];
  createdAt: string; // ISO date
}

export interface Settlement {
  id: string;
  householdId: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  createdAt: string;
}

export const users: User[] = [
  { id: 'u1', name: 'Alex Rivera', email: 'alex@maple.test', role: 'ADMIN' },
  { id: 'u2', name: 'Bailey Chen', email: 'bailey@maple.test', role: 'USER' },
  { id: 'u3', name: 'Casey Park', email: 'casey@maple.test', role: 'USER' },
];

export const households: Household[] = [
  { id: 'h1', name: 'Maple Street Apts', joinCode: 'MAPLE7', memberIds: ['u1', 'u2', 'u3'] },
  { id: 'h2', name: 'Lakeview Loft', joinCode: 'LAKE22', memberIds: ['u1', 'u2'] },
];

export const expenses: Expense[] = [
  ex('e1', 'Weekly groceries', 8400, 'u1', 5),
  ex('e2', 'Electric bill', 12050, 'u2', 7),
  ex('e3', 'Internet — July', 6500, 'u3', 9),
  ex('e4', 'Dish soap & supplies', 2340, 'u1', 11),
  ex('e5', 'Friday pizza night', 4875, 'u2', 12),
  ex('e6', 'Water bill', 5400, 'u3', 15),
  ex('e7', 'Paper towels', 1820, 'u1', 18),
  ex('e8', 'Streaming subscription', 1599, 'u2', 20),
  ex('e9', 'Light bulbs', 1200, 'u3', 24),
  ex('e10', 'Deep clean supplies', 3760, 'u1', 28),
];

function ex(
  id: string,
  description: string,
  amountCents: number,
  payerId: string,
  daysAgo: number,
): Expense {
  const base = Date.UTC(2026, 6, 17) - daysAgo * 86400000;
  return {
    id,
    householdId: 'h1',
    description,
    amountCents,
    payerId,
    participantIds: ['u1', 'u2', 'u3'],
    createdAt: new Date(base).toISOString(),
  };
}

export const settlements: Settlement[] = [
  { id: 's1', householdId: 'h1', fromUserId: 'u2', toUserId: 'u1', amountCents: 4000, createdAt: new Date(Date.UTC(2026, 6, 8)).toISOString() },
  { id: 's2', householdId: 'h1', fromUserId: 'u3', toUserId: 'u1', amountCents: 2500, createdAt: new Date(Date.UTC(2026, 6, 3)).toISOString() },
];

// ---- lookups -------------------------------------------------------------

export const userById = (id: string) => users.find((u) => u.id === id);
export const householdById = (id: string) => households.find((h) => h.id === id);
export const expenseById = (id: string) => expenses.find((e) => e.id === id);
export const membersOf = (h: Household) => h.memberIds.map((id) => userById(id)!).filter(Boolean);

export function fmt(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

export function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

// Equal split: distribute remainder cents to the earliest participants so the
// shares sum exactly to the total.
export function splitShares(amountCents: number, participantIds: string[]): Record<string, number> {
  const n = participantIds.length || 1;
  const base = Math.floor(amountCents / n);
  let remainder = amountCents - base * n;
  const out: Record<string, number> = {};
  for (const id of participantIds) {
    out[id] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
  }
  return out;
}

export interface MemberBalance {
  user: User;
  paidCents: number;
  owedCents: number;
  netCents: number; // positive => is owed money; negative => owes
}

export interface PairwiseOwe {
  from: User;
  to: User;
  amountCents: number;
}

export interface Balances {
  perMember: MemberBalance[];
  owes: PairwiseOwe[];
}

// net = paid - owed + settlement adjustments; pairwise via greedy reduction.
export function computeBalances(
  household: Household,
  hExpenses: Expense[],
  hSettlements: Settlement[],
): Balances {
  const members = membersOf(household);
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};
  members.forEach((m) => {
    paid[m.id] = 0;
    owed[m.id] = 0;
  });

  for (const e of hExpenses) {
    paid[e.payerId] = (paid[e.payerId] || 0) + e.amountCents;
    const shares = splitShares(e.amountCents, e.participantIds);
    for (const [uid, share] of Object.entries(shares)) owed[uid] = (owed[uid] || 0) + share;
  }

  const net: Record<string, number> = {};
  members.forEach((m) => {
    net[m.id] = (paid[m.id] || 0) - (owed[m.id] || 0);
  });
  for (const s of hSettlements) {
    net[s.fromUserId] = (net[s.fromUserId] || 0) + s.amountCents;
    net[s.toUserId] = (net[s.toUserId] || 0) - s.amountCents;
  }

  const perMember: MemberBalance[] = members.map((m) => ({
    user: m,
    paidCents: paid[m.id] || 0,
    owedCents: owed[m.id] || 0,
    netCents: net[m.id] || 0,
  }));

  // Greedy pairwise reduction.
  const debtors = perMember.filter((b) => b.netCents < 0).map((b) => ({ id: b.user.id, amt: -b.netCents })).sort((a, b) => b.amt - a.amt);
  const creditors = perMember.filter((b) => b.netCents > 0).map((b) => ({ id: b.user.id, amt: b.netCents })).sort((a, b) => b.amt - a.amt);
  const owes: PairwiseOwe[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if (pay > 0) {
      owes.push({ from: userById(debtors[i].id)!, to: userById(creditors[j].id)!, amountCents: pay });
    }
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt === 0) i++;
    if (creditors[j].amt === 0) j++;
  }

  return { perMember, owes };
}

export function householdExpenses(householdId: string): Expense[] {
  return expenses
    .filter((e) => e.householdId === householdId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function householdSettlements(householdId: string): Settlement[] {
  return settlements
    .filter((s) => s.householdId === householdId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const ADMIN_SERVICES = [
  { key: 'postgresql', label: 'PostgreSQL', configured: true, fields: ['Host', 'Port', 'Database', 'User', 'Password'] },
  { key: 'minio', label: 'MinIO (Object Storage)', configured: false, fields: ['Endpoint', 'Access Key', 'Secret Key', 'Bucket'] },
  { key: 'llm', label: 'LLM Provider', configured: false, fields: ['Base URL', 'API Key', 'Model'] },
];
