'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  computeBalances,
  fmt,
  householdById,
  householdExpenses,
  householdSettlements,
  membersOf,
} from '@/lib/mock';
import BalancesPanel from './BalancesPanel';
import ExpenseList from './ExpenseList';
import EmptyState from './EmptyState';
import AddExpenseModal from './AddExpenseModal';
import SettleUpModal from './SettleUpModal';

export default function Dashboard({ householdId }: { householdId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const modal = params.get('modal');

  const household = householdById(householdId);

  if (!household) {
    return (
      <div className="card" data-testid="dashboard-main">
        <EmptyState emoji="🏠" title="Household not found" subtitle="Pick a household from your settings." action={<Link className="btn btn-primary" href="/settings">Go to households</Link>} />
      </div>
    );
  }

  const members = membersOf(household);
  const expenses = householdExpenses(household.id);
  const settlements = householdSettlements(household.id);
  const balances = computeBalances(household, expenses, settlements);
  const total = expenses.reduce((s, e) => s + e.amountCents, 0);

  const openModal = (name: string) => router.push(`${pathname}?modal=${name}`);
  const closeModal = () => router.push(pathname);

  return (
    <div data-testid="dashboard-main">
      <div className="section">
        <h1 style={{ fontSize: 22 }}>{household.name}</h1>
        <p className="muted small">{members.length} members · code {household.joinCode}</p>
      </div>

      <div className="grid-2 section">
        <div className="card stat">
          <div className="k">Total logged</div>
          <div className="v">{fmt(total)}</div>
        </div>
        <div className="card stat">
          <div className="k">Expenses</div>
          <div className="v">{expenses.length}</div>
        </div>
      </div>

      <div className="grid-2 section">
        <button className="btn btn-primary" onClick={() => openModal('add-expense')}>+ Add expense</button>
        <button className="btn" onClick={() => openModal('settle')}>Settle up</button>
      </div>

      <BalancesPanel balances={balances} />

      <section className="section">
        <div className="section-head">
          <h2>Recent expenses</h2>
          <Link className="btn-ghost" href="/history">View all →</Link>
        </div>
        <ExpenseList expenses={expenses.slice(0, 6)} />
      </section>

      <button className="fab" onClick={() => openModal('add-expense')} aria-label="Add expense">+ Expense</button>

      {modal === 'add-expense' && <AddExpenseModal members={members} onClose={closeModal} />}
      {modal === 'settle' && <SettleUpModal members={members} onClose={closeModal} />}
    </div>
  );
}
