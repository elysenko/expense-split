import { Suspense } from 'react';
import HistoryFilters from '@/components/HistoryFilters';
import ExpenseList from '@/components/ExpenseList';
import { requireSession, loadHouseholdMembers } from '@/lib/session';
import { loadExpenses } from '@/lib/queries';
import { memberName } from '@/lib/view';

export const metadata = { title: 'History — SplitMate' };
export const dynamic = 'force-dynamic';

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string; from?: string; to?: string }>;
}) {
  const { member, from, to } = await searchParams;
  const { household } = await requireSession();

  // Filtering is driven entirely by the URL query string, applied at the DB.
  const [members, filtered] = await Promise.all([
    loadHouseholdMembers(household.id),
    loadExpenses(household.id, { member, from, to }),
  ]);

  const chips: string[] = [];
  if (member) chips.push(`Paid by ${memberName(members, member)}`);
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
        <HistoryFilters members={members} />
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
      <ExpenseList expenses={filtered} members={members} emptyTestId="history-empty" />
    </div>
  );
}
