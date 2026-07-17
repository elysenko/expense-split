import { prisma } from '@/lib/db';
import { json, auth, requireMember } from '@/lib/api';

// GET /api/households/:id/members — member roster (members only). No passwordHash.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = auth(req);
  if ('res' in a) return a.res;
  const { id } = await params;

  const guard = await requireMember(a.session.sub, id);
  if (guard) return guard;

  const memberships = await prisma.membership.findMany({
    where: { householdId: id },
    include: { user: true },
    orderBy: { joinedAt: 'asc' },
  });

  return json(
    memberships.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.user.role,
    })),
  );
}
