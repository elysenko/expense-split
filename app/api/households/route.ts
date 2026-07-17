import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

function randomCode(): string {
  let word = '';
  for (let i = 0; i < 5; i += 1) {
    word += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

async function uniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = randomCode();
    const clash = await prisma.household.findUnique({ where: { joinCode: code } });
    if (!clash) return code;
  }
  // Extremely unlikely — fall back to a longer suffix.
  return `${randomCode()}${Math.floor(Math.random() * 90 + 10)}`;
}

export async function POST(request: Request) {
  const ctx = await getCurrentUser();
  if (!ctx) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let body: { name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Give your household a name.' }, { status: 400 });

  const joinCode = await uniqueJoinCode();

  const household = await prisma.household.create({
    data: {
      name,
      joinCode,
      memberships: { create: { userId: ctx.user.id } },
    },
  });

  return NextResponse.json({
    ok: true,
    redirect: '/dashboard',
    household: { id: household.id, name: household.name, joinCode: household.joinCode },
  });
}
