import React from 'react';
import Link from 'next/link';
import { expenseById, fmt, initials, splitShares, userById } from '@/lib/mock';
import EmptyState from '@/app/components/EmptyState';

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expense = expenseById(id);

  if (!expense) {
    return (
      <div className="card" data-testid="expense-detail">
        <EmptyState emoji="🔍" title="Expense not found" subtitle="It may have been removed." action={<Link className="btn btn-primary" href="/history">Back to history</Link>} />
      </div>
    );
  }

  const payer = userById(expense.payerId);
  const shares = splitShares(expense.amountCents, expense.participantIds);
  const date = new Date(expense.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div data-testid="expense-detail">
      <Link className="btn-ghost" href="/history">← History</Link>

      <div className="card section" style={{ padding: 18, marginTop: 10 }}>
        <p className="muted small">{date}</p>
        <h1 style={{ fontSize: 24, margin: '4px 0 10px' }}>{expense.description}</h1>
        <div style={{ fontSize: 32, fontWeight: 800 }}>{fmt(expense.amountCents)}</div>
        <p className="muted" style={{ marginTop: 6 }}>
          Paid by <strong>{payer?.name}</strong> · split {expense.participantIds.length} ways
        </p>
      </div>

      <section className="section">
        <div className="section-head"><h2>Each person's share</h2></div>
        <div className="card list">
          {expense.participantIds.map((uid) => {
            const u = userById(uid);
            return (
              <div className="row" key={uid}>
                <span className={`avatar sm a${uid.replace('u', '')}`} aria-hidden>{u ? initials(u.name) : '?'}</span>
                <div className="row-main">
                  <div className="row-title">{u?.name}{uid === expense.payerId && <span className="tag info" style={{ marginLeft: 8 }}>paid</span>}</div>
                </div>
                <span className="row-amt">{fmt(shares[uid])}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
