import Link from 'next/link';
import ExpenseList from '@/components/ExpenseList';
import BalancesSection from '@/components/BalancesSection';
import AddExpenseModal from '@/components/AddExpenseModal';
import SettleUpModal from '@/components/SettleUpModal';
import {
  EXPENSES,
  SETTLEMENTS,
  MEMBERS,
  computeBalances,
} from '@/lib/mockData';

export const metadata = { title: 'Dashboard — SplitMate' };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ modal?: string }>;
}) {
  const { modal } = await searchParams;
  const recent = [...EXPENSES]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);
  const balances = computeBalances(EXPENSES, SETTLEMENTS, MEMBERS);

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

      <BalancesSection balances={balances} members={MEMBERS} />

      <section className="section">
        <div className="section-head">
          <h2>Recent expenses</h2>
          <Link href="/history">View all</Link>
        </div>
        <ExpenseList expenses={recent} />
      </section>

      {modal === 'add-expense' && <AddExpenseModal />}
      {modal === 'settle' && <SettleUpModal />}
    </div>
  );
}
