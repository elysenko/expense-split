import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { take: 1 } },
  });
  if (!user || !(await verifyPassword(password, user.password))) {
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  const redirect = user.memberships.length > 0 ? '/dashboard' : '/onboarding';
  const res = NextResponse.json({ ok: true, redirect });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
