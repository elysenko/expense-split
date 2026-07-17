import { prisma } from '@/lib/db';
import { json, auth, requireMember } from '@/lib/api';
import { computeBalances } from '@/lib/balances';

// GET /api/households/:id/balances — per-member net + pairwise "who owes what".
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = auth(req);
  if ('res' in a) return a.res;
  const { id } = await params;

  const guard = await requireMember(a.session.sub, id);
  if (guard) return guard;

  const [memberships, expenses, settlements] = await Promise.all([
    prisma.membership.findMany({ where: { householdId: id }, orderBy: { joinedAt: 'asc' } }),
    prisma.expense.findMany({ where: { householdId: id }, include: { shares: true } }),
    prisma.settlement.findMany({ where: { householdId: id } }),
  ]);

  const memberIds = memberships.map((m) => m.userId);
  const balances = computeBalances(
    memberIds,
    expenses.map((e) => ({
      payerId: e.payerId,
      amountCents: e.amountCents,
      shares: e.shares.map((s) => ({ userId: s.userId, shareCents: s.shareCents })),
    })),
    settlements.map((s) => ({
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amountCents: s.amountCents,
    })),
  );

  return json(balances);
}
