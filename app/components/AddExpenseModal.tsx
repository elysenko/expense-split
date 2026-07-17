'use client';

import React, { useState } from 'react';
import { fmt, splitShares, type User } from '@/lib/mock';

export default function AddExpenseModal({ members, onClose }: { members: User[]; onClose: () => void }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(members[0]?.id ?? '');
  const [selected, setSelected] = useState<string[]>(members.map((m) => m.id));
  const [error, setError] = useState('');

  const cents = Math.round(parseFloat(amount || '0') * 100);
  const preview = cents > 0 && selected.length > 0 ? splitShares(cents, selected) : {};

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return setError('Add a short description.');
    if (!(cents > 0)) return setError('Enter an amount greater than zero.');
    if (selected.length === 0) return setError('Select at least one member to split with.');
    // Mockup: no persistence — confirm and close.
    onClose();
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
              {members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
          </div>
          <div className="field">
            <label>Split between</label>
            {members.map((m) => (
              <label className="checkline" key={m.id}>
                <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggle(m.id)} />
                <span>{m.name}</span>
                {preview[m.id] != null && <span className="muted" style={{ marginLeft: 'auto' }}>{fmt(preview[m.id])}</span>}
              </label>
            ))}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" style={{ marginTop: 8 }}>Add expense</button>
        </form>
      </div>
    </div>
  );
}
