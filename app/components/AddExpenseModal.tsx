'use client';

import React, { useState } from 'react';
import { fmt } from '@/lib/format';
import { splitShares } from '@/lib/balances';
import { api, type Member } from '@/lib/client';

export default function AddExpenseModal({
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
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(members[0]?.userId ?? '');
  const [selected, setSelected] = useState<string[]>(members.map((m) => m.userId));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const cents = Math.round(parseFloat(amount || '0') * 100);
  const preview: Record<string, number> =
    cents > 0 && selected.length > 0
      ? Object.fromEntries(splitShares(cents, selected).map((s) => [s.userId, s.shareCents]))
      : {};

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return setError('Add a short description.');
    if (!(cents > 0)) return setError('Enter an amount greater than zero.');
    if (selected.length === 0) return setError('Select at least one member to split with.');
    setError('');
    setBusy(true);
    try {
      await api.createExpense(householdId, {
        description: description.trim(),
        amountCents: cents,
        payerId,
        memberIds: selected,
      });
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the expense.');
      setBusy(false);
    }
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Add expense" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add expense</h2>
          <button className="chip-btn" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="ae-desc">Description</label>
            <input id="ae-desc" className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Groceries" />
          </div>
          <div className="field">
            <label htmlFor="ae-amt">Amount ($)</label>
            <input id="ae-amt" className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div className="field">
            <label htmlFor="ae-payer">Paid by</label>
            <select id="ae-payer" className="select" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
              {members.map((m) => (<option key={m.userId} value={m.userId}>{m.name}</option>))}
            </select>
          </div>
          <div className="field">
            <label>Split between</label>
            {members.map((m) => (
              <label className="checkline" key={m.userId}>
                <input type="checkbox" checked={selected.includes(m.userId)} onChange={() => toggle(m.userId)} />
                <span>{m.name}</span>
                {preview[m.userId] != null && <span className="muted" style={{ marginLeft: 'auto' }}>{fmt(preview[m.userId])}</span>}
              </label>
            ))}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" style={{ marginTop: 8 }} disabled={busy}>{busy ? 'Saving…' : 'Add expense'}</button>
        </form>
      </div>
    </div>
  );
}
