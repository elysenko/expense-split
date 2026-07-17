'use client';

import React, { useState } from 'react';
import { api, type Member } from '@/lib/client';

export default function SettleUpModal({
  householdId,
  members,
  onClose,
  onCreated,
}: {
  householdId: string;
  members: Member[];
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [fromId, setFromId] = useState(members[0]?.userId ?? '');
  const [toId, setToId] = useState(members[1]?.userId ?? members[0]?.userId ?? '');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount || '0') * 100);
    if (fromId === toId) return setError('Payer and recipient must be different people.');
    if (!(cents > 0)) return setError('Enter an amount greater than zero.');
    setError('');
    setBusy(true);
    try {
      await api.createSettlement(householdId, { fromUserId: fromId, toUserId: toId, amountCents: cents });
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the payment.');
      setBusy(false);
    }
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Settle up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Settle up</h2>
          <button className="chip-btn" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="su-from">From (who paid)</label>
            <select id="su-from" className="select" value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {members.map((m) => (<option key={m.userId} value={m.userId}>{m.name}</option>))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="su-to">To (who received)</label>
            <select id="su-to" className="select" value={toId} onChange={(e) => setToId(e.target.value)}>
              {members.map((m) => (<option key={m.userId} value={m.userId}>{m.name}</option>))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="su-amt">Amount ($)</label>
            <input id="su-amt" className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" style={{ marginTop: 8 }} disabled={busy}>{busy ? 'Recording…' : 'Record payment'}</button>
        </form>
      </div>
    </div>
  );
}
