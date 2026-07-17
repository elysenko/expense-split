// Shared helpers for API route handlers: JSON responses, auth/membership guards,
// safe body parsing, and join-code generation.
import { NextResponse } from 'next/server';
import { prisma } from './db';
import { getSession, type SessionClaims } from './auth';

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Returns the authenticated session or a 401 response. Callers check `res`.
export function auth(req: Request): { session: SessionClaims } | { res: NextResponse } {
  const session = getSession(req);
  if (!session) return { res: error('Unauthorized', 401) };
  return { session };
}

// Assert the user is a member of the household. Distinguishes not-found (404)
// from not-a-member (403) so guarded reads behave per the spec.
export async function requireMember(
  userId: string,
  householdId: string,
): Promise<NextResponse | null> {
  const household = await prisma.household.findUnique({ where: { id: householdId } });
  if (!household) return error('Household not found', 404);
  const membership = await prisma.membership.findUnique({
    where: { userId_householdId: { userId, householdId } },
  });
  if (!membership) return error('Forbidden', 403);
  return null;
}

// Parse a JSON body, returning null on any parse failure.
export async function readBody<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateJoinCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

// Generate a join code guaranteed unique against existing households.
export async function uniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateJoinCode();
    const existing = await prisma.household.findUnique({ where: { joinCode: code } });
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique join code');
}

export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

export const isPositiveInt = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v > 0;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
