'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MEMBERS, CURRENT_USER_ID } from '@/lib/mockData';

export default function AddExpenseModal() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(CURRENT_USER_ID);
  const [split, setSplit] = useState<string[]>(MEMBERS.map((m) => m.id));
  const [error, setError] = useState('');

  const close = () => router.push('/dashboard');

  const toggle = (id: string) =>
    setSplit((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return setError('Add a description.');
    if (!(Number(amount) > 0)) return setError('Enter an amount greater than $0.');
    if (split.length === 0) return setError('Select at least one person to split with.');
    // Mockup: no persistence — in the real app this POSTs to /api/expenses then router.refresh().
    close();
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
              {MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{m.id === CURRENT_USER_ID ? ' (you)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Split equally between</label>
            {MEMBERS.map((m) => (
              <label key={m.id} className="checkbox-row">
                <input type="checkbox" checked={split.includes(m.id)} onChange={() => toggle(m.id)} />
                <span className="who">{m.name}{m.id === CURRENT_USER_ID ? ' (you)' : ''}</span>
              </label>
            ))}
          </div>
          <button type="submit" className="btn primary block" data-testid="add-expense-submit">
            Add expense
          </button>
        </form>
      </div>
    </div>
  );
}
