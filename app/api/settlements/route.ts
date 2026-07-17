import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/settlements — record a payment from one household member to another.
export async function POST(request: Request) {
  const ctx = await getCurrentUser();
  if (!ctx) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!ctx.household) return NextResponse.json({ error: 'No household.' }, { status: 400 });

  let body: { fromUserId?: unknown; toUserId?: unknown; amountCents?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const fromUserId = typeof body.fromUserId === 'string' ? body.fromUserId : '';
  const toUserId = typeof body.toUserId === 'string' ? body.toUserId : '';
  const amountCents =
    typeof body.amountCents === 'number' ? Math.round(body.amountCents) : NaN;

  if (!fromUserId || !toUserId) {
    return NextResponse.json({ error: 'Pick who paid and who received.' }, { status: 400 });
  }
  if (fromUserId === toUserId) {
    return NextResponse.json({ error: 'Pick two different people.' }, { status: 400 });
  }
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: 'Enter an amount greater than $0.' }, { status: 400 });
  }

  const members = await prisma.membership.findMany({
    where: { householdId: ctx.household.id, userId: { in: [fromUserId, toUserId] } },
    select: { userId: true },
  });
  const validIds = new Set(members.map((m) => m.userId));
  if (!validIds.has(fromUserId) || !validIds.has(toUserId)) {
    return NextResponse.json({ error: 'Both people must belong to the household.' }, { status: 400 });
  }

  const settlement = await prisma.settlement.create({
    data: { householdId: ctx.household.id, fromUserId, toUserId, amountCents },
  });

  return NextResponse.json({ ok: true, id: settlement.id });
}
