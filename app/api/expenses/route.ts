import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { equalSplit } from '@/lib/balances';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/expenses?member=&from=&to= — expenses for the caller's household,
// optionally filtered by payer and created-at date range.
export async function GET(request: Request) {
  const ctx = await getCurrentUser();
  if (!ctx) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!ctx.household) return NextResponse.json({ error: 'No household.' }, { status: 400 });

  const url = new URL(request.url);
  const member = url.searchParams.get('member') || undefined;
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (from) createdAt.gte = new Date(from);
  if (to) {
    // inclusive end-of-day for a date-only "to" filter
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    createdAt.lte = end;
  }

  const expenses = await prisma.expense.findMany({
    where: {
      householdId: ctx.household.id,
      ...(member ? { payerId: member } : {}),
      ...(from || to ? { createdAt } : {}),
    },
    include: { shares: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    expenses: expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amountCents: e.amountCents,
      payerId: e.payerId,
      createdAt: e.createdAt.toISOString(),
      memberIds: e.shares.map((s) => s.userId),
    })),
  });
}

// POST /api/expenses — create an expense with an equal split across memberIds.
export async function POST(request: Request) {
  const ctx = await getCurrentUser();
  if (!ctx) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!ctx.household) return NextResponse.json({ error: 'No household.' }, { status: 400 });

  let body: { description?: unknown; amountCents?: unknown; payerId?: unknown; memberIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const amountCents =
    typeof body.amountCents === 'number' ? Math.round(body.amountCents) : NaN;
  const payerId = typeof body.payerId === 'string' ? body.payerId : '';
  const memberIds = Array.isArray(body.memberIds)
    ? Array.from(new Set(body.memberIds.filter((x): x is string => typeof x === 'string')))
    : [];

  if (!description) return NextResponse.json({ error: 'Add a description.' }, { status: 400 });
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: 'Enter an amount greater than $0.' }, { status: 400 });
  }
  if (memberIds.length === 0) {
    return NextResponse.json({ error: 'Select at least one person to split with.' }, { status: 400 });
  }

  // Everyone referenced must belong to this household.
  const validMembers = await prisma.membership.findMany({
    where: { householdId: ctx.household.id, userId: { in: [payerId, ...memberIds] } },
    select: { userId: true },
  });
  const validIds = new Set(validMembers.map((m) => m.userId));
  if (!validIds.has(payerId)) {
    return NextResponse.json({ error: 'Payer is not a household member.' }, { status: 400 });
  }
  if (!memberIds.every((id) => validIds.has(id))) {
    return NextResponse.json({ error: 'All split members must belong to the household.' }, { status: 400 });
  }

  const shares = equalSplit(amountCents, memberIds);

  const expense = await prisma.expense.create({
    data: {
      householdId: ctx.household.id,
      description,
      amountCents,
      payerId,
      shares: {
        create: memberIds.map((userId) => ({ userId, shareCents: shares[userId] })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: expense.id });
}
