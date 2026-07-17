import { prisma } from '@/lib/db';
import { signToken, hashPassword } from '@/lib/auth';
import { json, error, readBody, isNonEmptyString, EMAIL_RE } from '@/lib/api';

// POST /api/auth/signup — create a user. First user on an empty DB becomes ADMIN.
export async function POST(req: Request) {
  const body = await readBody<{ email?: string; password?: string; name?: string }>(req);
  if (!body) return error('Invalid JSON body', 400);

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const { password, name } = body;

  if (!isNonEmptyString(email) || !EMAIL_RE.test(email)) return error('Valid email is required', 400);
  if (!isNonEmptyString(name)) return error('Name is required', 400);
  if (typeof password !== 'string' || password.length < 8)
    return error('Password must be at least 8 characters', 400);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return error('Email already registered', 409);

  const userCount = await prisma.user.count();
  const role = userCount === 0 ? 'ADMIN' : 'USER';

  const user = await prisma.user.create({
    data: { email, name: name.trim(), password: hashPassword(password), role },
  });

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return json(
    { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } },
    201,
  );
}
