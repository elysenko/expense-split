// Server-only session helpers. Read the httpOnly session cookie, verify the
// JWT, and load the current user + their (first) household membership from the
// DB. Guards live in server components / route handlers — NOT Edge middleware —
// because jsonwebtoken needs Node crypto.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';
import { SESSION_COOKIE, verifyToken } from './auth';
import { initialsOf, type Member } from './view';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export interface CurrentHousehold {
  id: string;
  name: string;
  joinCode: string;
}

export interface SessionContext {
  user: CurrentUser;
  household: CurrentHousehold | null;
}

/** Read + verify the session cookie. Returns null when unauthenticated. */
export async function getSessionClaims() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Load the authenticated user and their active (first) household, or null if
 * there is no valid session. Also returns null if the token references a user
 * that no longer exists.
 */
export async function getCurrentUser(): Promise<SessionContext | null> {
  const claims = await getSessionClaims();
  if (!claims?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    include: {
      memberships: {
        orderBy: { joinedAt: 'asc' },
        take: 1,
        include: { household: true },
      },
    },
  });
  if (!user) return null;

  const membership = user.memberships[0];
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    household: membership
      ? {
          id: membership.household.id,
          name: membership.household.name,
          joinCode: membership.household.joinCode,
        }
      : null,
  };
}

/**
 * Require an authenticated user with a household. Redirects to /login when
 * there is no session and to /onboarding when the user has no household yet.
 * Returns a context whose household is always non-null.
 */
export async function requireSession(): Promise<{ user: CurrentUser; household: CurrentHousehold }> {
  const ctx = await getCurrentUser();
  if (!ctx) redirect('/login');
  if (!ctx.household) redirect('/onboarding');
  return { user: ctx.user, household: ctx.household };
}

/** Load every member of a household as a view Member[] (stable name order). */
export async function loadHouseholdMembers(householdId: string): Promise<Member[]> {
  const memberships = await prisma.membership.findMany({
    where: { householdId },
    include: { user: true },
    orderBy: { joinedAt: 'asc' },
  });
  return memberships.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    initials: initialsOf(m.user.name),
  }));
}
