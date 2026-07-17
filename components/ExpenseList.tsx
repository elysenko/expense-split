import Link from 'next/link';
import EmptyState from './EmptyState';
import {
  Expense,
  formatCents,
  formatDate,
  memberById,
  memberName,
} from '@/lib/mockData';

export default function ExpenseList({
  expenses,
  emptyTestId = 'expenses-empty',
}: {
  expenses: Expense[];
  emptyTestId?: string;
}) {
  if (expenses.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon="🧾"
          title="No expenses yet"
          message="Add your first shared expense to start splitting."
          testId={emptyTestId}
        />
      </div>
    );
  }

  return (
    <ul className="card" data-testid="expense-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {expenses.map((e) => {
        const payer = memberById(e.payerId);
        return (
          <li key={e.id}>
            <Link href={`/expenses/${e.id}`} className="expense-row">
              <span className="avatar sm" aria-hidden>{payer?.initials ?? '?'}</span>
              <span className="body">
                <span className="desc">{e.description}</span>
                <span className="meta">
                  {memberName(e.payerId)} paid · {formatDate(e.createdAt)}
                </span>
              </span>
              <span className="right">
                <span className="amt">{formatCents(e.amountCents)}</span>
                <br />
                <span className="split">split {e.memberIds.length} ways</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
