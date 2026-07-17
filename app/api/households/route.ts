import { prisma } from '@/lib/db';
import { json, error, auth, readBody, isNonEmptyString, uniqueJoinCode } from '@/lib/api';

// GET /api/households — households the authed user belongs to, most-recently-active first.
export async function GET(req: Request) {
  const a = auth(req);
  if ('res' in a) return a.res;

  const memberships = await prisma.membership.findMany({
    where: { userId: a.session.sub },
    include: {
      household: {
        include: { expenses: { orderBy: { createdAt: 'desc' }, take: 1 } },
      },
    },
  });

  const list = memberships
    .map((m) => {
      const h = m.household;
      const lastActivity = h.expenses[0]?.createdAt ?? h.createdAt;
      return {
        id: h.id,
        name: h.name,
        joinCode: h.joinCode,
        createdAt: h.createdAt,
        lastActivity,
      };
    })
    .sort((x, y) => new Date(y.lastActivity).getTime() - new Date(x.lastActivity).getTime());

  return json(list);
}

// POST /api/households — create a household; creator becomes the first member.
export async function POST(req: Request) {
  const a = auth(req);
  if ('res' in a) return a.res;

  const body = await readBody<{ name?: string }>(req);
  if (!body) return error('Invalid JSON body', 400);
  if (!isNonEmptyString(body.name)) return error('Household name is required', 400);

  const joinCode = await uniqueJoinCode();
  const household = await prisma.household.create({
    data: {
      name: body.name.trim(),
      joinCode,
      memberships: { create: { userId: a.session.sub } },
    },
  });

  return json({ id: household.id, name: household.name, joinCode: household.joinCode }, 201);
}
