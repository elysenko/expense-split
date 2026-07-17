import Link from 'next/link';
import ExpenseList from '@/components/ExpenseList';
import BalancesSection from '@/components/BalancesSection';
import AddExpenseModal from '@/components/AddExpenseModal';
import SettleUpModal from '@/components/SettleUpModal';
import { requireSession, loadHouseholdMembers } from '@/lib/session';
import { loadExpenses, loadSettlements } from '@/lib/queries';
import { computeBalances } from '@/lib/balances';

export const metadata = { title: 'Dashboard — SplitMate' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ modal?: string }>;
}) {
  const { modal } = await searchParams;
  const { user, household } = await requireSession();

  const [members, expenses, settlements] = await Promise.all([
    loadHouseholdMembers(household.id),
    loadExpenses(household.id),
    loadSettlements(household.id),
  ]);

  const recent = expenses.slice(0, 5);
  const balances = computeBalances(expenses, settlements, members);

  return (
    <div data-testid="dashboard-main">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="page-sub">Your shared household at a glance</p>
        </div>
      </div>

      <div className="fab-row">
        <Link href="/dashboard?modal=add-expense" className="btn primary" data-testid="open-add-expense">
          ＋ Add expense
        </Link>
        <Link href="/dashboard?modal=settle" className="btn ghost" data-testid="open-settle">
          Settle up
        </Link>
      </div>

      <BalancesSection balances={balances} members={members} currentUserId={user.id} />

      <section className="section">
        <div className="section-head">
          <h2>Recent expenses</h2>
          <Link href="/history">View all</Link>
        </div>
        <ExpenseList expenses={recent} members={members} />
      </section>

      {modal === 'add-expense' && <AddExpenseModal members={members} currentUserId={user.id} />}
      {modal === 'settle' && <SettleUpModal members={members} currentUserId={user.id} />}
    </div>
  );
}
