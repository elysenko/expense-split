import { prisma } from '@/lib/db';
import { json, error, auth, requireMember } from '@/lib/api';

// GET /api/expenses/:id — single expense with its shares (members of the owning
// household only).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = auth(req);
  if ('res' in a) return a.res;
  const { id } = await params;

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { shares: true },
  });
  if (!expense) return error('Expense not found', 404);

  const guard = await requireMember(a.session.sub, expense.householdId);
  if (guard) return guard;

  return json({
    expense: {
      id: expense.id,
      householdId: expense.householdId,
      description: expense.description,
      amountCents: expense.amountCents,
      payerId: expense.payerId,
      createdAt: expense.createdAt,
    },
    shares: expense.shares.map((s) => ({ userId: s.userId, shareCents: s.shareCents })),
  });
}
