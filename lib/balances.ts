// Pure balance math for the household ledger. No DB access — callers pass
// plain view objects (see lib/view.ts). Money is always integer cents.
import type { Balances, Expense, Member, Pairwise, Settlement } from './view';

/**
 * Split amountCents equally across memberIds. Remainder cents (amount not evenly
 * divisible by the member count) are distributed one-per-member to the FIRST
 * members, so the returned shares always sum back to exactly amountCents.
 */
export function equalSplit(amountCents: number, memberIds: string[]): Record<string, number> {
  const shares: Record<string, number> = {};
  const n = memberIds.length;
  if (n === 0) return shares;
  const base = Math.floor(amountCents / n);
  let remainder = amountCents - base * n;
  for (const id of memberIds) {
    shares[id] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
  }
  return shares;
}

/**
 * Compute per-member net balances and a greedy pairwise settle-up plan.
 *
 * net[member] = Σ(amounts they paid) − Σ(their own equal-split shares),
 * then each settlement A→B nudges A's net up and B's net down (A paying down
 * a debt to B). Positive net = the household owes this member; negative net =
 * this member owes the household. Pairwise is a minimal "who owes who" list.
 */
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
    net[s.fromUserId] = (net[s.fromUserId] ?? 0) + s.amountCents;
    net[s.toUserId] = (net[s.toUserId] ?? 0) - s.amountCents;
  }

  // Greedy min-transfers: match largest debtor to largest creditor repeatedly.
  const debtors = members
    .map((m) => ({ id: m.id, amt: net[m.id] ?? 0 }))
    .filter((x) => x.amt < 0)
    .map((x) => ({ id: x.id, amt: -x.amt }))
    .sort((a, b) => b.amt - a.amt);
  const creditors = members
    .map((m) => ({ id: m.id, amt: net[m.id] ?? 0 }))
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
