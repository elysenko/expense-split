'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, buildMemberMap, type Expense, type Member } from '@/lib/client';
import ExpenseList from './ExpenseList';
import EmptyState from './EmptyState';

export default function HistoryView() {
  const router = useRouter();
  const params = useSearchParams();

  const member = params.get('member') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [noHousehold, setNoHousehold] = useState(false);

  // Resolve the user's primary household and its roster once.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const hs = await api.listHouseholds();
        if (!active) return;
        if (hs.length === 0) {
          setNoHousehold(true);
          return;
        }
        const id = hs[0].id;
        setHouseholdId(id);
        setMembers(await api.listMembers(id));
      } catch {
        if (active) setNoHousehold(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Filters are driven by the URL: refetch from the API whenever they change.
  useEffect(() => {
    if (!householdId) return;
    let active = true;
    setExpenses(null);
    api
      .listExpenses(householdId, { member: member || undefined, from: from || undefined, to: to || undefined })
      .then((rows) => active && setExpenses(rows))
      .catch(() => active && setExpenses([]));
    return () => {
      active = false;
    };
  }, [householdId, member, from, to]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/history${next.toString() ? `?${next.toString()}` : ''}`);
  }

  if (noHousehold) {
    return (
      <div>
        <div className="section"><h1 style={{ fontSize: 22 }}>History</h1></div>
        <div className="card">
          <EmptyState emoji="🏡" title="No household yet" subtitle="Create or join a household to track expenses." action={<Link className="btn btn-primary" href="/settings">Go to households</Link>} />
        </div>
      </div>
    );
  }

  const active = member || from || to;
  const memberMap = buildMemberMap(members);
  const count = expenses?.length ?? 0;

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
              {members.map((m) => (<option key={m.userId} value={m.userId}>{m.name}</option>))}
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

      {expenses === null ? (
        <div className="card"><div className="empty">Loading…</div></div>
      ) : (
        <>
          <p className="muted small" style={{ marginBottom: 8 }}>{count} expense{count === 1 ? '' : 's'}</p>
          <ExpenseList expenses={expenses} memberMap={memberMap} />
        </>
      )}
    </div>
  );
}
