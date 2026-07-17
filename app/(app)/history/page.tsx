import { Suspense } from 'react';
import HistoryFilters from '@/components/HistoryFilters';
import ExpenseList from '@/components/ExpenseList';
import { EXPENSES, MEMBERS, memberName } from '@/lib/mockData';

export const metadata = { title: 'History — SplitMate' };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string; from?: string; to?: string }>;
}) {
  const { member, from, to } = await searchParams;

  // Server-side filtering driven entirely by the URL query string.
  const filtered = EXPENSES.filter((e) => {
    if (member && e.payerId !== member) return false;
    if (from && e.createdAt < from) return false;
    if (to && e.createdAt > to) return false;
    return true;
  }).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const chips: string[] = [];
  if (member) chips.push(`Paid by ${memberName(member)}`);
  if (from) chips.push(`From ${from}`);
  if (to) chips.push(`To ${to}`);

  return (
    <div data-testid="history-main">
      <div className="page-head">
        <div>
          <h1>Expense history</h1>
          <p className="page-sub">Filter by roommate and date — the link stays shareable</p>
        </div>
      </div>

      <Suspense fallback={null}>
        <HistoryFilters />
      </Suspense>

      {chips.length > 0 && (
        <div className="filter-active">
          {chips.map((c) => (
            <span key={c} className="chip">{c}</span>
          ))}
        </div>
      )}

      <p className="page-sub" style={{ marginBottom: 10 }}>
        {filtered.length} expense{filtered.length === 1 ? '' : 's'}
      </p>
      <ExpenseList expenses={filtered} emptyTestId="history-empty" />
    </div>
  );
}
