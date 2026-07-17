'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Member } from '@/lib/view';

// Filters are URL-bound: selections are serialized to the query string so a
// reload (or a shared/bookmarked link) reproduces the exact filtered view.
export default function HistoryFilters({ members }: { members: Member[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const member = params.get('member') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.push(qs ? `/history?${qs}` : '/history');
  };

  const clearAll = () => router.push('/history');
  const hasFilters = Boolean(member || from || to);

  return (
    <div className="card" style={{ padding: 14, marginBottom: 16 }}>
      <div className="filters">
        <div className="field full">
          <label htmlFor="f-member">Roommate</label>
          <select id="f-member" className="input" data-testid="filter-member"
            value={member} onChange={(e) => update('member', e.target.value)}>
            <option value="">Everyone</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-from">From</label>
          <input id="f-from" className="input" type="date" data-testid="filter-from"
            value={from} onChange={(e) => update('from', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-to">To</label>
          <input id="f-to" className="input" type="date" data-testid="filter-to"
            value={to} onChange={(e) => update('to', e.target.value)} />
        </div>
      </div>
      {hasFilters && (
        <button className="btn ghost sm" onClick={clearAll} style={{ marginTop: 12 }}>
          Clear filters
        </button>
      )}
    </div>
  );
}
