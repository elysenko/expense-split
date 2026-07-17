import { prisma } from '@/lib/db';
import { json, error, auth } from '@/lib/api';

// GET /api/auth/me — current user for a valid bearer token.
export async function GET(req: Request) {
  const a = auth(req);
  if ('res' in a) return a.res;

  const user = await prisma.user.findUnique({ where: { id: a.session.sub } });
  if (!user) return error('Unauthorized', 401);

  return json({ id: user.id, email: user.email, name: user.name, role: user.role });
}
