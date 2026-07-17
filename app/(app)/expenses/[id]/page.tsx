import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireSession, loadHouseholdMembers } from '@/lib/session';
import { formatCents, formatDate, memberById, memberName } from '@/lib/view';

export const metadata = { title: 'Expense — SplitMate' };
export const dynamic = 'force-dynamic';

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, household } = await requireSession();

  const expense = await prisma.expense.findFirst({
    where: { id, householdId: household.id },
    include: { shares: true },
  });
  if (!expense) notFound();

  const members = await loadHouseholdMembers(household.id);
  const shares: Record<string, number> = {};
  for (const s of expense.shares) shares[s.userId] = s.shareCents;
  const memberIds = expense.shares.map((s) => s.userId);

  return (
    <div data-testid="expense-detail-main">
      <div className="page-head">
        <Link href="/history" className="btn ghost sm">← Back</Link>
      </div>

      <section className="card" style={{ padding: 18, marginBottom: 22 }}>
        <h1 style={{ fontSize: '1.35rem' }}>{expense.description}</h1>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)', margin: '8px 0' }}>
          {formatCents(expense.amountCents)}
        </div>
        <div className="page-sub">
          Paid by <b>{memberName(members, expense.payerId)}</b> · {formatDate(expense.createdAt.toISOString())}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Split breakdown</h2></div>
        <div className="card">
          {memberIds.map((mid) => {
            const m = memberById(members, mid);
            return (
              <div key={mid} className="member-net">
                <span className="avatar sm" aria-hidden>{m?.initials ?? '?'}</span>
                <span className="who">
                  {m?.name}{mid === user.id ? ' (you)' : ''}
                  {mid === expense.payerId && <span className="badge ok" style={{ marginLeft: 8 }}>payer</span>}
                </span>
                <span className="amt">{formatCents(shares[mid])}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
