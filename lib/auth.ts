// JWT session helpers (auth_pattern: jwt_session) + password hashing.
// The session is an HS256 JWT stored in an httpOnly `session` cookie. Route
// handlers verify it via verifyToken(); server components read it via
// lib/session.ts. Password hashing uses bcryptjs (no native bindings — works
// in the standalone Docker image without node-gyp).
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

/** Cookie name for the session JWT. Shared by route handlers and lib/session. */
export const SESSION_COOKIE = 'session';

/** Seconds the session JWT (and cookie) stay valid. */
export const SESSION_MAX_AGE = 60 * 60 * 24; // 1 day

export interface SessionClaims {
  sub: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export function signToken(claims: SessionClaims): string {
  return jwt.sign(claims, SECRET, { expiresIn: SESSION_MAX_AGE });
}

export function verifyToken(token: string): SessionClaims | null {
  try {
    return jwt.verify(token, SECRET) as SessionClaims;
  } catch {
    return null;
  }
}

/** Hash a plaintext password with bcrypt (10 rounds). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Compare a plaintext password against a stored bcrypt hash. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Cookie options for the session cookie (Secure only in production). */
export function sessionCookieOptions(): {
  httpOnly: boolean;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}
