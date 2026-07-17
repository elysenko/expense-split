import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Use a password with at least 6 characters.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { name, email, password: await hashPassword(password), role: 'USER' },
  });

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  const res = NextResponse.json({ ok: true, redirect: '/onboarding' });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
