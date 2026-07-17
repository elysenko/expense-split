import { prisma } from '@/lib/db';
import { json, error, auth, requireMember, readBody, isNonEmptyString, isPositiveInt } from '@/lib/api';
import { splitShares } from '@/lib/balances';
import type { Prisma } from '@prisma/client';

// GET /api/households/:id/expenses — list, newest first. Filters: member, from, to.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = auth(req);
  if ('res' in a) return a.res;
  const { id } = await params;

  const guard = await requireMember(a.session.sub, id);
  if (guard) return guard;

  const url = new URL(req.url);
  const member = url.searchParams.get('member');
  const fromRaw = url.searchParams.get('from');
  const toRaw = url.searchParams.get('to');

  const where: Prisma.ExpenseWhereInput = { householdId: id };

  if (fromRaw || toRaw) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (fromRaw) {
      const from = new Date(fromRaw);
      if (Number.isNaN(from.getTime())) return error('Invalid "from" date', 400);
      createdAt.gte = from;
    }
    if (toRaw) {
      const to = new Date(toRaw);
      if (Number.isNaN(to.getTime())) return error('Invalid "to" date', 400);
      // Inclusive end-of-day when a bare date is given.
      if (/^\d{4}-\d{2}-\d{2}$/.test(toRaw)) to.setUTCHours(23, 59, 59, 999);
      createdAt.lte = to;
    }
    where.createdAt = createdAt;
  }

  // member filter: user is payer OR holds a share.
  if (member) {
    where.OR = [{ payerId: member }, { shares: { some: { userId: member } } }];
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { shares: true },
  });

  return json(
    expenses.map((e) => ({
      id: e.id,
      householdId: e.householdId,
      description: e.description,
      amountCents: e.amountCents,
      payerId: e.payerId,
      createdAt: e.createdAt,
      shares: e.shares.map((s) => ({ userId: s.userId, shareCents: s.shareCents })),
    })),
  );
}

// POST /api/households/:id/expenses — create an equal-split expense.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = auth(req);
  if ('res' in a) return a.res;
  const { id } = await params;

  const guard = await requireMember(a.session.sub, id);
  if (guard) return guard;

  const body = await readBody<{
    description?: string;
    amountCents?: number;
    payerId?: string;
    memberIds?: string[];
  }>(req);
  if (!body) return error('Invalid JSON body', 400);

  if (!isNonEmptyString(body.description)) return error('Description is required', 400);
  if (!isPositiveInt(body.amountCents)) return error('amountCents must be a positive integer', 400);
  if (!isNonEmptyString(body.payerId)) return error('payerId is required', 400);
  if (!Array.isArray(body.memberIds) || body.memberIds.length === 0)
    return error('memberIds must be a non-empty array', 400);

  // Every payer/member must belong to this household.
  const memberships = await prisma.membership.findMany({ where: { householdId: id } });
  const memberSet = new Set(memberships.map((m) => m.userId));
  if (!memberSet.has(body.payerId)) return error('payerId is not a household member', 400);
  const uniqueMemberIds = Array.from(new Set(body.memberIds));
  for (const uid of uniqueMemberIds) {
    if (!memberSet.has(uid)) return error(`memberId ${uid} is not a household member`, 400);
  }

  const shares = splitShares(body.amountCents, uniqueMemberIds);

  const expense = await prisma.expense.create({
    data: {
      householdId: id,
      description: body.description.trim(),
      amountCents: body.amountCents,
      payerId: body.payerId,
      shares: { create: shares.map((s) => ({ userId: s.userId, shareCents: s.shareCents })) },
    },
    include: { shares: true },
  });

  return json(
    {
      id: expense.id,
      householdId: expense.householdId,
      description: expense.description,
      amountCents: expense.amountCents,
      payerId: expense.payerId,
      createdAt: expense.createdAt,
      shares: expense.shares.map((s) => ({ userId: s.userId, shareCents: s.shareCents })),
    },
    201,
  );
}
