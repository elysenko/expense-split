// Minimal JWT session helpers (auth_pattern: jwt_session). API routes verify the
// bearer token via getSession(); passwords are hashed with SHA-256 to match the
// seed (prisma/seed.ts) so seeded demo users can log in.
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface SessionClaims {
  sub: string; // user id
  email: string;
  role: 'ADMIN' | 'USER';
}

export function signToken(claims: SessionClaims): string {
  // HS256 (jwt default), signed with JWT_SECRET.
  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '12h') as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(claims, SECRET, options);
}

export function verifyToken(token: string): SessionClaims | null {
  try {
    return jwt.verify(token, SECRET) as SessionClaims;
  } catch {
    return null;
  }
}

// Password hashing — SHA-256 hex. Kept identical to prisma/seed.ts so the
// seeded demo credentials authenticate against these routes.
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Extract and verify the bearer token from a request's Authorization header.
export function getSession(req: Request): SessionClaims | null {
  const header = req.headers.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return verifyToken(token);
}
