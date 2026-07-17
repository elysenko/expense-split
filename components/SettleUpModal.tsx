'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MEMBERS, CURRENT_USER_ID } from '@/lib/mockData';

export default function SettleUpModal() {
  const router = useRouter();
  const [fromId, setFromId] = useState(CURRENT_USER_ID);
  const [toId, setToId] = useState(MEMBERS.find((m) => m.id !== CURRENT_USER_ID)?.id ?? '');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const close = () => router.push('/dashboard');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromId === toId) return setError('Pick two different people.');
    if (!(Number(amount) > 0)) return setError('Enter an amount greater than $0.');
    // Mockup: no persistence — real app POSTs to /api/settlements then router.refresh().
    close();
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
              {MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{m.id === CURRENT_USER_ID ? ' (you)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="su-to">To (recipient)</label>
            <select id="su-to" className="input" data-testid="settle-to"
              value={toId} onChange={(e) => setToId(e.target.value)}>
              {MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{m.id === CURRENT_USER_ID ? ' (you)' : ''}</option>
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
          <button type="submit" className="btn primary block" data-testid="settle-submit">
            Record payment
          </button>
        </form>
      </div>
    </div>
  );
}
