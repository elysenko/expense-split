// Minimal JWT session helpers (auth_pattern: jwt_session). The coder extends
// these; API routes verify the bearer token via verifyToken().
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface SessionClaims {
  sub: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export function signToken(claims: SessionClaims): string {
  return jwt.sign(claims, SECRET, { expiresIn: '12h' });
}

export function verifyToken(token: string): SessionClaims | null {
  try {
    return jwt.verify(token, SECRET) as SessionClaims;
  } catch {
    return null;
  }
}
