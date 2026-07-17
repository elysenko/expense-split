'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Member } from '@/lib/view';

export default function AddExpenseModal({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(currentUserId);
  const [split, setSplit] = useState<string[]>(members.map((m) => m.id));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const close = () => router.push('/dashboard');

  const toggle = (id: string) =>
    setSplit((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return setError('Add a description.');
    if (!(Number(amount) > 0)) return setError('Enter an amount greater than $0.');
    if (split.length === 0) return setError('Select at least one person to split with.');
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          amountCents: Math.round(Number(amount) * 100),
          payerId,
          memberIds: split,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaving(false);
        return setError(data.error || 'Could not add the expense.');
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setSaving(false);
      setError('Could not add the expense.');
    }
  };

  return (
    <div className="modal-overlay" onClick={close} role="dialog" aria-modal="true" aria-label="Add expense">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add expense</h2>
          <button className="modal-close" onClick={close} aria-label="Close">×</button>
        </div>

        <form onSubmit={submit} data-testid="add-expense-form">
          {error && <div className="form-error">{error}</div>}
          <div className="field">
            <label htmlFor="ae-desc">Description</label>
            <input id="ae-desc" className="input" data-testid="add-expense-description"
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Groceries" />
          </div>
          <div className="field">
            <label htmlFor="ae-amount">Amount (USD)</label>
            <input id="ae-amount" className="input" data-testid="add-expense-amount"
              type="number" inputMode="decimal" step="0.01" min="0"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" />
          </div>
          <div className="field">
            <label htmlFor="ae-payer">Paid by</label>
            <select id="ae-payer" className="input" data-testid="add-expense-payer"
              value={payerId} onChange={(e) => setPayerId(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{m.id === currentUserId ? ' (you)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Split equally between</label>
            {members.map((m) => (
              <label key={m.id} className="checkbox-row">
                <input type="checkbox" checked={split.includes(m.id)} onChange={() => toggle(m.id)} />
                <span className="who">{m.name}{m.id === currentUserId ? ' (you)' : ''}</span>
              </label>
            ))}
          </div>
          <button type="submit" className="btn primary block" data-testid="add-expense-submit" disabled={saving}>
            {saving ? 'Adding…' : 'Add expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
