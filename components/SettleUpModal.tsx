'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Member } from '@/lib/view';

export default function SettleUpModal({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [fromId, setFromId] = useState(currentUserId);
  const [toId, setToId] = useState(members.find((m) => m.id !== currentUserId)?.id ?? '');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const close = () => router.push('/dashboard');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromId === toId) return setError('Pick two different people.');
    if (!(Number(amount) > 0)) return setError('Enter an amount greater than $0.');
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: fromId,
          toUserId: toId,
          amountCents: Math.round(Number(amount) * 100),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaving(false);
        return setError(data.error || 'Could not record the payment.');
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setSaving(false);
      setError('Could not record the payment.');
    }
  };

  return (
    <div className="modal-overlay" onClick={close} role="dialog" aria-modal="true" aria-label="Settle up">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Settle up</h2>
          <button className="modal-close" onClick={close} aria-label="Close">×</button>
        </div>

        <form onSubmit={submit} data-testid="settle-form">
          {error && <div className="form-error">{error}</div>}
          <div className="field">
            <label htmlFor="su-from">From (payer)</label>
            <select id="su-from" className="input" data-testid="settle-from"
              value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{m.id === currentUserId ? ' (you)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="su-to">To (recipient)</label>
            <select id="su-to" className="input" data-testid="settle-to"
              value={toId} onChange={(e) => setToId(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{m.id === currentUserId ? ' (you)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="su-amount">Amount (USD)</label>
            <input id="su-amount" className="input" data-testid="settle-amount"
              type="number" inputMode="decimal" step="0.01" min="0"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" />
          </div>
          <button type="submit" className="btn primary block" data-testid="settle-submit" disabled={saving}>
            {saving ? 'Recording…' : 'Record payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
