import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  EXPENSES,
  MEMBERS,
  equalSplit,
  formatCents,
  formatDate,
  memberById,
  memberName,
  CURRENT_USER_ID,
} from '@/lib/mockData';

export const metadata = { title: 'Expense — SplitMate' };

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expense = EXPENSES.find((e) => e.id === id);
  if (!expense) notFound();

  const shares = equalSplit(expense.amountCents, expense.memberIds);
  const payer = memberById(expense.payerId);

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
          Paid by <b>{memberName(expense.payerId)}</b> · {formatDate(expense.createdAt)}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Split breakdown</h2></div>
        <div className="card">
          {expense.memberIds.map((mid) => {
            const m = memberById(mid);
            return (
              <div key={mid} className="member-net">
                <span className="avatar sm" aria-hidden>{m?.initials ?? '?'}</span>
                <span className="who">
                  {m?.name}{mid === CURRENT_USER_ID ? ' (you)' : ''}
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
