import React from 'react';
import { fmt, initials, type Balances } from '@/lib/mock';
import EmptyState from './EmptyState';

function avatarClass(userId: string) {
  return `avatar sm a${userId.replace('u', '') || '1'}`;
}

export default function BalancesPanel({ balances }: { balances: Balances }) {
  const settled = balances.owes.length === 0;
  return (
    <section className="section">
      <div className="section-head">
        <h2 data-testid="balances-heading">Who Owes What</h2>
        {settled ? <span className="tag pos">All settled</span> : <span className="tag info">{balances.owes.length} to settle</span>}
      </div>

      <div className="card list" style={{ marginBottom: 12 }}>
        {balances.perMember.map((b) => {
          const label = b.netCents > 0 ? 'gets back' : b.netCents < 0 ? 'owes' : 'settled up';
          const cls = b.netCents > 0 ? 'pos' : b.netCents < 0 ? 'neg' : '';
          return (
            <div className="balance-row" key={b.user.id}>
              <span className={avatarClass(b.user.id)} aria-hidden>{initials(b.user.name)}</span>
              <div className="row-main">
                <div className="row-title">{b.user.name}</div>
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
              <span className="tag neg">{o.from.name.split(' ')[0]}</span>
              <span className="muted">owes</span>
              <span className="tag pos">{o.to.name.split(' ')[0]}</span>
              <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{fmt(o.amountCents)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
