import {
  type Balances,
  type Member,
  formatCents,
  memberName,
} from '@/lib/view';

export default function BalancesSection({
  balances,
  members,
  currentUserId,
}: {
  balances: Balances;
  members: Member[];
  currentUserId: string;
}) {
  const myNet = balances.net[currentUserId] ?? 0;
  const heroLabel =
    myNet > 0 ? 'You are owed' : myNet < 0 ? 'You owe' : 'You are settled up';

  return (
    <section className="section" aria-labelledby="balances-heading">
      <div className="section-head">
        <h2 id="balances-heading" data-testid="balances-heading">Balances</h2>
      </div>

      <div className="balance-hero" style={{ marginBottom: 14 }}>
        <div className="label">{heroLabel}</div>
        <div className="amount">{formatCents(Math.abs(myNet))}</div>
        <div className="hint">
          {myNet === 0
            ? 'Everything is even across the household.'
            : myNet > 0
              ? 'Roommates owe you this overall.'
              : 'You owe this to the household overall.'}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        {members.map((m) => {
          const net = balances.net[m.id] ?? 0;
          const cls = net > 0 ? 'pos' : net < 0 ? 'neg' : 'zero';
          const label =
            net > 0 ? `is owed ${formatCents(net)}`
              : net < 0 ? `owes ${formatCents(-net)}`
                : 'settled up';
          return (
            <div key={m.id} className="member-net">
              <span className="avatar sm" aria-hidden>{m.initials}</span>
              <span className="who">
                {m.name}{m.id === currentUserId ? ' (you)' : ''}
              </span>
              <span className={`amt ${cls}`}>{label}</span>
            </div>
          );
        })}
      </div>

      <div className="section-head">
        <h3 style={{ fontSize: '0.95rem' }}>Who owes who</h3>
      </div>
      <div className="card">
        {balances.pairwise.length === 0 ? (
          <div className="member-net"><span className="who" style={{ color: 'var(--muted)' }}>Everyone is settled up 🎉</span></div>
        ) : (
          balances.pairwise.map((p, i) => (
            <div key={i} className="owes-row">
              <span className="avatar sm" aria-hidden>{memberName(members, p.fromId).slice(0, 1)}</span>
              <span><b>{memberName(members, p.fromId)}</b> <span className="arrow">owes</span> <b>{memberName(members, p.toId)}</b></span>
              <span className="amt">{formatCents(p.amountCents)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
