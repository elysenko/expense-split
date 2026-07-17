'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api, buildMemberMap, type Balances, type Expense, type Household, type Member, type MemberInfo } from '@/lib/client';
import { fmt } from '@/lib/format';
import BalancesPanel from './BalancesPanel';
import ExpenseList from './ExpenseList';
import EmptyState from './EmptyState';
import AddExpenseModal from './AddExpenseModal';
import SettleUpModal from './SettleUpModal';

interface DashboardData {
  household: Household;
  members: Member[];
  expenses: Expense[];
  balances: Balances;
}

export default function Dashboard({ householdId }: { householdId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const modal = params.get('modal');

  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');

  const load = useCallback(async () => {
    try {
      const [household, members, expenses, balances] = await Promise.all([
        api.getHousehold(householdId),
        api.listMembers(householdId),
        api.listExpenses(householdId),
        api.getBalances(householdId),
      ]);
      setData({ household, members, expenses, balances });
      setStatus('ready');
    } catch (err) {
      const status = (err as { status?: number }).status;
      setStatus(status === 404 || status === 403 ? 'notfound' : 'error');
    }
  }, [householdId]);

  useEffect(() => {
    setStatus('loading');
    load();
  }, [load]);

  if (status === 'loading') {
    return (
      <div className="card" data-testid="dashboard-main"><div className="empty">Loading…</div></div>
    );
  }

  if (status === 'notfound' || !data) {
    return (
      <div className="card" data-testid="dashboard-main">
        <EmptyState emoji="🏠" title="Household not found" subtitle="Pick a household from your settings." action={<Link className="btn btn-primary" href="/settings">Go to households</Link>} />
      </div>
    );
  }

  const { household, members, expenses, balances } = data;
  const memberMap: Record<string, MemberInfo> = buildMemberMap(members);
  const total = expenses.reduce((s, e) => s + e.amountCents, 0);

  const openModal = (name: string) => router.push(`${pathname}?modal=${name}`);
  const closeModal = () => router.push(pathname);
  const afterMutation = async () => {
    await load();
    closeModal();
  };

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

      <BalancesPanel balances={balances} memberMap={memberMap} />

      <section className="section">
        <div className="section-head">
          <h2>Recent expenses</h2>
          <Link className="btn-ghost" href="/history">View all →</Link>
        </div>
        <ExpenseList expenses={expenses.slice(0, 6)} memberMap={memberMap} />
      </section>

      <button className="fab" onClick={() => openModal('add-expense')} aria-label="Add expense">+ Expense</button>

      {modal === 'add-expense' && (
        <AddExpenseModal householdId={household.id} members={members} onClose={closeModal} onCreated={afterMutation} />
      )}
      {modal === 'settle' && (
        <SettleUpModal householdId={household.id} members={members} onClose={closeModal} onCreated={afterMutation} />
      )}
    </div>
  );
}
