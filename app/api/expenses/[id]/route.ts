import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/expenses/[id] — expense detail with per-member shares, scoped to
// the caller's household.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCurrentUser();
  if (!ctx) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!ctx.household) return NextResponse.json({ error: 'No household.' }, { status: 400 });

  const { id } = await params;
  const expense = await prisma.expense.findFirst({
    where: { id, householdId: ctx.household.id },
    include: { shares: true, payer: true },
  });
  if (!expense) return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });

  return NextResponse.json({
    expense: {
      id: expense.id,
      description: expense.description,
      amountCents: expense.amountCents,
      payerId: expense.payerId,
      createdAt: expense.createdAt.toISOString(),
      memberIds: expense.shares.map((s) => s.userId),
      shares: expense.shares.map((s) => ({ userId: s.userId, shareCents: s.shareCents })),
    },
  });
}
