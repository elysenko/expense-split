import { prisma } from '@/lib/db';
import { json, auth, requireMember } from '@/lib/api';

// GET /api/households/:id — household detail (members only).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = auth(req);
  if ('res' in a) return a.res;
  const { id } = await params;

  const guard = await requireMember(a.session.sub, id);
  if (guard) return guard;

  const household = await prisma.household.findUnique({ where: { id } });
  if (!household) return json({ error: 'Household not found' }, 404);

  return json({
    id: household.id,
    name: household.name,
    joinCode: household.joinCode,
    createdAt: household.createdAt,
  });
}
