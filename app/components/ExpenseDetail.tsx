'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, buildMemberMap, type ExpenseDetailResponse, type MemberInfo } from '@/lib/client';
import { fmt, initials, dateLong } from '@/lib/format';
import EmptyState from './EmptyState';

export default function ExpenseDetail({ id }: { id: string }) {
  const [data, setData] = useState<ExpenseDetailResponse | null>(null);
  const [memberMap, setMemberMap] = useState<Record<string, MemberInfo>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound'>('loading');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const detail = await api.getExpense(id);
        if (!active) return;
        setData(detail);
        try {
          const members = await api.listMembers(detail.expense.householdId);
          if (active) setMemberMap(buildMemberMap(members));
        } catch {
          /* roster is best-effort; names fall back gracefully */
        }
        setStatus('ready');
      } catch {
        if (active) setStatus('notfound');
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (status === 'loading') {
    return <div className="card" data-testid="expense-detail"><div className="empty">Loading…</div></div>;
  }

  if (status === 'notfound' || !data) {
    return (
      <div className="card" data-testid="expense-detail">
        <EmptyState emoji="🔍" title="Expense not found" subtitle="It may have been removed." action={<Link className="btn btn-primary" href="/history">Back to history</Link>} />
      </div>
    );
  }

  const { expense, shares } = data;
  const payerName = memberMap[expense.payerId]?.name ?? 'Someone';
  const date = dateLong(expense.createdAt);

  return (
    <div data-testid="expense-detail">
      <Link className="btn-ghost" href="/history">← History</Link>

      <div className="card section" style={{ padding: 18, marginTop: 10 }}>
        <p className="muted small">{date}</p>
        <h1 style={{ fontSize: 24, margin: '4px 0 10px' }}>{expense.description}</h1>
        <div style={{ fontSize: 32, fontWeight: 800 }}>{fmt(expense.amountCents)}</div>
        <p className="muted" style={{ marginTop: 6 }}>
          Paid by <strong>{payerName}</strong> · split {shares.length} ways
        </p>
      </div>

      <section className="section">
        <div className="section-head"><h2>Each person&apos;s share</h2></div>
        <div className="card list">
          {shares.map((s) => {
            const member = memberMap[s.userId];
            return (
              <div className="row" key={s.userId}>
                <span className={`avatar sm ${member?.color ?? 'a1'}`} aria-hidden>{initials(member?.name ?? '?')}</span>
                <div className="row-main">
                  <div className="row-title">{member?.name ?? 'Unknown'}{s.userId === expense.payerId && <span className="tag info" style={{ marginLeft: 8 }}>paid</span>}</div>
                </div>
                <span className="row-amt">{fmt(s.shareCents)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
