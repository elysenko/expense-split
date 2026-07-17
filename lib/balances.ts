// Pure balance math shared by the balances endpoint. All money is integer cents.

export interface ShareRow {
  userId: string;
  shareCents: number;
}

export interface ExpenseRow {
  payerId: string;
  amountCents: number;
  shares: ShareRow[];
}

export interface SettlementRow {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

export interface NetEntry {
  userId: string;
  netCents: number; // positive => is owed money; negative => owes
}

export interface OweEntry {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

export interface Balances {
  net: NetEntry[];
  owes: OweEntry[];
}

// Equal split: distribute remainder cents to the earliest members so shares sum
// exactly to the total. Returns one entry per memberId, in order.
export function splitShares(amountCents: number, memberIds: string[]): ShareRow[] {
  const n = memberIds.length || 1;
  const base = Math.floor(amountCents / n);
  let remainder = amountCents - base * n;
  return memberIds.map((userId) => {
    const shareCents = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    return { userId, shareCents };
  });
}

// net = sum(paid) - sum(owed); a settlement A->B moves A's net up (they paid down
// their debt) and B's net down. Pairwise "owes" computed by greedy reduction.
export function computeBalances(
  memberIds: string[],
  expenses: ExpenseRow[],
  settlements: SettlementRow[],
): Balances {
  const net: Record<string, number> = {};
  memberIds.forEach((id) => {
    net[id] = 0;
  });

  for (const e of expenses) {
    net[e.payerId] = (net[e.payerId] || 0) + e.amountCents;
    for (const s of e.shares) net[s.userId] = (net[s.userId] || 0) - s.shareCents;
  }
  for (const s of settlements) {
    net[s.fromUserId] = (net[s.fromUserId] || 0) + s.amountCents;
    net[s.toUserId] = (net[s.toUserId] || 0) - s.amountCents;
  }

  const netEntries: NetEntry[] = memberIds.map((userId) => ({
    userId,
    netCents: net[userId] || 0,
  }));

  // Greedy pairwise reduction: match largest debtor to largest creditor.
  const debtors = netEntries
    .filter((b) => b.netCents < 0)
    .map((b) => ({ id: b.userId, amt: -b.netCents }))
    .sort((a, b) => b.amt - a.amt);
  const creditors = netEntries
    .filter((b) => b.netCents > 0)
    .map((b) => ({ id: b.userId, amt: b.netCents }))
    .sort((a, b) => b.amt - a.amt);

  const owes: OweEntry[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if (pay > 0) {
      owes.push({ fromUserId: debtors[i].id, toUserId: creditors[j].id, amountCents: pay });
    }
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt === 0) i++;
    if (creditors[j].amt === 0) j++;
  }

  return { net: netEntries, owes };
}
