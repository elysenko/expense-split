import React from 'react';
import Link from 'next/link';
import { fmt, initials, userById, type Expense } from '@/lib/mock';
import EmptyState from './EmptyState';

function avatarClass(userId: string) {
  return `avatar sm a${userId.replace('u', '') || '1'}`;
}

function dateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ExpenseList({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return (
      <div className="card" data-testid="expense-list">
        <EmptyState
          testid="expense-list-empty"
          emoji="🧾"
          title="No expenses yet"
          subtitle="Add your first shared expense to get things rolling."
        />
      </div>
    );
  }

  return (
    <div className="card list" data-testid="expense-list">
      {expenses.map((e) => {
        const payer = userById(e.payerId);
        return (
          <Link key={e.id} href={`/expenses/${e.id}`} className="row" data-testid="expense-row">
            <span className={avatarClass(e.payerId)} aria-hidden>{payer ? initials(payer.name) : '?'}</span>
            <div className="row-main">
              <div className="row-title">{e.description}</div>
              <div className="row-sub">{payer?.name.split(' ')[0]} paid · {dateLabel(e.createdAt)} · split {e.participantIds.length} ways</div>
            </div>
            <div className="row-amt">{fmt(e.amountCents)}</div>
          </Link>
        );
      })}
    </div>
  );
}
