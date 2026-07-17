import React from 'react';
import { fmt, initials } from '@/lib/format';
import type { Balances, MemberInfo } from '@/lib/client';
import EmptyState from './EmptyState';

function nameOf(map: Record<string, MemberInfo>, id: string): string {
  return map[id]?.name ?? 'Unknown';
}

function firstName(map: Record<string, MemberInfo>, id: string): string {
  return nameOf(map, id).split(' ')[0];
}

export default function BalancesPanel({
  balances,
  memberMap,
}: {
  balances: Balances;
  memberMap: Record<string, MemberInfo>;
}) {
  const settled = balances.owes.length === 0;
  return (
    <section className="section">
      <div className="section-head">
        <h2 data-testid="balances-heading">Who Owes What</h2>
        {settled ? <span className="tag pos">All settled</span> : <span className="tag info">{balances.owes.length} to settle</span>}
      </div>

      <div className="card list" style={{ marginBottom: 12 }}>
        {balances.net.map((b) => {
          const member = memberMap[b.userId];
          const label = b.netCents > 0 ? 'gets back' : b.netCents < 0 ? 'owes' : 'settled up';
          const cls = b.netCents > 0 ? 'pos' : b.netCents < 0 ? 'neg' : '';
          return (
            <div className="balance-row" key={b.userId}>
              <span className={`avatar sm ${member?.color ?? 'a1'}`} aria-hidden>{initials(nameOf(memberMap, b.userId))}</span>
              <div className="row-main">
                <div className="row-title">{nameOf(memberMap, b.userId)}</div>
                <div className="row-sub">{label}</div>
              </div>
              <span className={`net ${cls}`}>{b.netCents === 0 ? '$0.00' : fmt(Math.abs(b.netCents))}</span>
            </div>
          );
        })}
      </div>

      {settled ? (
        <div className="card">
          <EmptyState testid="balances-empty" emoji="🎉" title="Everyone's square" subtitle="No outstanding debts in this household." />
        </div>
      ) : (
        <div className="card list">
          {balances.owes.map((o, i) => (
            <div className="owe-pill" key={i}>
              <span className="tag neg">{firstName(memberMap, o.fromUserId)}</span>
              <span className="muted">owes</span>
              <span className="tag pos">{firstName(memberMap, o.toUserId)}</span>
              <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{fmt(o.amountCents)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
