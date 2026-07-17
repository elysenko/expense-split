import { prisma } from '@/lib/db';
import { json, error, auth, requireMember, readBody, isNonEmptyString, isPositiveInt } from '@/lib/api';

// GET /api/households/:id/settlements — list repayments, newest first.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = auth(req);
  if ('res' in a) return a.res;
  const { id } = await params;

  const guard = await requireMember(a.session.sub, id);
  if (guard) return guard;

  const settlements = await prisma.settlement.findMany({
    where: { householdId: id },
    orderBy: { createdAt: 'desc' },
  });

  return json(
    settlements.map((s) => ({
      id: s.id,
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amountCents: s.amountCents,
      createdAt: s.createdAt,
    })),
  );
}

// POST /api/households/:id/settlements — record a repayment from one member to another.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = auth(req);
  if ('res' in a) return a.res;
  const { id } = await params;

  const guard = await requireMember(a.session.sub, id);
  if (guard) return guard;

  const body = await readBody<{ fromUserId?: string; toUserId?: string; amountCents?: number }>(req);
  if (!body) return error('Invalid JSON body', 400);

  if (!isNonEmptyString(body.fromUserId)) return error('fromUserId is required', 400);
  if (!isNonEmptyString(body.toUserId)) return error('toUserId is required', 400);
  if (body.fromUserId === body.toUserId) return error('fromUserId and toUserId must differ', 400);
  if (!isPositiveInt(body.amountCents)) return error('amountCents must be a positive integer', 400);

  const memberships = await prisma.membership.findMany({ where: { householdId: id } });
  const memberSet = new Set(memberships.map((m) => m.userId));
  if (!memberSet.has(body.fromUserId)) return error('fromUserId is not a household member', 400);
  if (!memberSet.has(body.toUserId)) return error('toUserId is not a household member', 400);

  const settlement = await prisma.settlement.create({
    data: {
      householdId: id,
      fromUserId: body.fromUserId,
      toUserId: body.toUserId,
      amountCents: body.amountCents,
    },
  });

  return json(
    {
      id: settlement.id,
      fromUserId: settlement.fromUserId,
      toUserId: settlement.toUserId,
      amountCents: settlement.amountCents,
      createdAt: settlement.createdAt,
    },
    201,
  );
}
