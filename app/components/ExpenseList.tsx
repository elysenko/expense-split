import React from 'react';
import Link from 'next/link';
import { fmt, initials, dateShort } from '@/lib/format';
import type { Expense, MemberInfo } from '@/lib/client';
import EmptyState from './EmptyState';

export default function ExpenseList({
  expenses,
  memberMap,
}: {
  expenses: Expense[];
  memberMap: Record<string, MemberInfo>;
}) {
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
        const payer = memberMap[e.payerId];
        const payerName = payer?.name ?? 'Someone';
        return (
          <Link key={e.id} href={`/expenses/${e.id}`} className="row" data-testid="expense-row">
            <span className={`avatar sm ${payer?.color ?? 'a1'}`} aria-hidden>{initials(payerName)}</span>
            <div className="row-main">
              <div className="row-title">{e.description}</div>
              <div className="row-sub">{payerName.split(' ')[0]} paid · {dateShort(e.createdAt)} · split {e.shares.length} ways</div>
            </div>
            <div className="row-amt">{fmt(e.amountCents)}</div>
          </Link>
        );
      })}
    </div>
  );
}
