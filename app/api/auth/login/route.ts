import { prisma } from '@/lib/db';
import { signToken, verifyPassword } from '@/lib/auth';
import { json, error, readBody, isNonEmptyString } from '@/lib/api';

// POST /api/auth/login — verify credentials, return a JWT.
export async function POST(req: Request) {
  const body = await readBody<{ email?: string; password?: string }>(req);
  if (!body) return error('Invalid JSON body', 400);

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const { password } = body;

  if (!isNonEmptyString(email)) return error('Email is required', 400);
  if (!isNonEmptyString(password)) return error('Password is required', 400);

  const user = await prisma.user.findUnique({ where: { email } });
  // Same 401 for unknown email or wrong password — do not disclose which failed.
  if (!user || !verifyPassword(password, user.password))
    return error('Invalid email or password', 401);

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
