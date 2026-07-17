// Server-side read helpers that map Prisma rows into the view shapes used by
// pages/components (lib/view.ts). Kept separate from lib/session.ts so pages
// import only what they need.
import { prisma } from './prisma';
import type { Expense, Settlement } from './view';

export interface ExpenseFilter {
  member?: string;
  from?: string;
  to?: string;
}

/** Load a household's expenses (newest first) with the members who split each. */
export async function loadExpenses(householdId: string, filter: ExpenseFilter = {}): Promise<Expense[]> {
  const createdAt: { gte?: Date; lte?: Date } = {};
  if (filter.from) createdAt.gte = new Date(filter.from);
  if (filter.to) {
    const end = new Date(filter.to);
    end.setHours(23, 59, 59, 999);
    createdAt.lte = end;
  }

  const rows = await prisma.expense.findMany({
    where: {
      householdId,
      ...(filter.member ? { payerId: filter.member } : {}),
      ...(filter.from || filter.to ? { createdAt } : {}),
    },
    include: { shares: true },
    orderBy: { createdAt: 'desc' },
  });

  return rows.map((e) => ({
    id: e.id,
    description: e.description,
    amountCents: e.amountCents,
    payerId: e.payerId,
    createdAt: e.createdAt.toISOString(),
    memberIds: e.shares.map((s) => s.userId),
  }));
}

/** Load a household's settlements (newest first). */
export async function loadSettlements(householdId: string): Promise<Settlement[]> {
  const rows = await prisma.settlement.findMany({
    where: { householdId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((s) => ({
    id: s.id,
    fromUserId: s.fromUserId,
    toUserId: s.toUserId,
    amountCents: s.amountCents,
    createdAt: s.createdAt.toISOString(),
  }));
}
