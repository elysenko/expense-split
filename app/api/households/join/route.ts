import { prisma } from '@/lib/db';
import { json, error, auth, readBody, isNonEmptyString } from '@/lib/api';

// POST /api/households/join — join a household by code. Idempotent: joining a
// household the user already belongs to succeeds without a duplicate membership.
export async function POST(req: Request) {
  const a = auth(req);
  if ('res' in a) return a.res;

  const body = await readBody<{ joinCode?: string }>(req);
  if (!body) return error('Invalid JSON body', 400);
  if (!isNonEmptyString(body.joinCode)) return error('joinCode is required', 400);

  const code = body.joinCode.trim().toUpperCase();
  const household = await prisma.household.findUnique({ where: { joinCode: code } });
  if (!household) return error('No household found for that code', 404);

  await prisma.membership.upsert({
    where: { userId_householdId: { userId: a.session.sub, householdId: household.id } },
    update: {},
    create: { userId: a.session.sub, householdId: household.id },
  });

  return json({ id: household.id, name: household.name, joinCode: household.joinCode }, 200);
}
