import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const ctx = await getCurrentUser();
  if (!ctx) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!code) return NextResponse.json({ error: 'Enter the join code your roommate shared.' }, { status: 400 });

  const household = await prisma.household.findUnique({ where: { joinCode: code } });
  if (!household) {
    return NextResponse.json({ error: 'No household found for that code.' }, { status: 404 });
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_householdId: { userId: ctx.user.id, householdId: household.id } },
  });
  if (!existing) {
    await prisma.membership.create({
      data: { userId: ctx.user.id, householdId: household.id },
    });
  }

  return NextResponse.json({
    ok: true,
    redirect: '/dashboard',
    household: { id: household.id, name: household.name, joinCode: household.joinCode },
  });
}
