'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { households, householdExpenses, membersOf } from '@/lib/mock';
import ExpenseList from './ExpenseList';

const HOUSEHOLD_ID = 'h1';

export default function HistoryView() {
  const router = useRouter();
  const params = useSearchParams();

  const member = params.get('member') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';

  const household = households.find((h) => h.id === HOUSEHOLD_ID)!;
  const members = membersOf(household);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/history${next.toString() ? `?${next.toString()}` : ''}`);
  }

  let expenses = householdExpenses(HOUSEHOLD_ID);
  if (member) expenses = expenses.filter((e) => e.payerId === member || e.participantIds.includes(member));
  if (from) expenses = expenses.filter((e) => e.createdAt.slice(0, 10) >= from);
  if (to) expenses = expenses.filter((e) => e.createdAt.slice(0, 10) <= to);

  const active = member || from || to;

  return (
    <div>
      <div className="section">
        <h1 style={{ fontSize: 22 }}>History</h1>
        <p className="muted small">Filters are saved in the URL — bookmark or share it to keep this view.</p>
      </div>

      <div className="card section" style={{ padding: 14 }}>
        <div className="filter-grid">
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="f-member">Member</label>
            <select id="f-member" className="select" value={member} onChange={(e) => setParam('member', e.target.value)}>
              <option value="">All members</option>
              {members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="f-from">From</label>
            <input id="f-from" className="input" type="date" value={from} onChange={(e) => setParam('from', e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="f-to">To</label>
            <input id="f-to" className="input" type="date" value={to} onChange={(e) => setParam('to', e.target.value)} />
          </div>
        </div>
        {active && (
          <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => router.replace('/history')}>Clear filters</button>
        )}
      </div>

      <p className="muted small" style={{ marginBottom: 8 }}>{expenses.length} expense{expenses.length === 1 ? '' : 's'}</p>
      <ExpenseList expenses={expenses} />
    </div>
  );
}
