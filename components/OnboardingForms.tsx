'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingForms() {
  const router = useRouter();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [error, setError] = useState('');

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Give your household a name.');
    setError('');
    // Mockup: real app POSTs /api/households and returns the generated code.
    setCreatedCode('MAPLE-' + (1000 + name.length * 37).toString().slice(0, 4));
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return setError('Enter the join code your roommate shared.');
    setError('');
    // Mockup: real app POSTs /api/households/join then redirects.
    router.push('/dashboard');
  };

  return (
    <>
      <div className="fab-row">
        <button className={`btn ${tab === 'create' ? 'primary' : 'ghost'}`} onClick={() => setTab('create')}>
          Create household
        </button>
        <button className={`btn ${tab === 'join' ? 'primary' : 'ghost'}`} onClick={() => setTab('join')}>
          Join with code
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {tab === 'create' ? (
        createdCode ? (
          <div className="card" style={{ padding: 18 }}>
            <h2 style={{ fontSize: '1.05rem', marginBottom: 6 }}>Household created 🎉</h2>
            <p className="page-sub" style={{ marginBottom: 14 }}>
              Share this join code with your roommates so they can join.
            </p>
            <div className="joincode-box" style={{ marginBottom: 16 }}>
              <span className="code">{createdCode}</span>
            </div>
            <button className="btn primary block" onClick={() => router.push('/dashboard')}>
              Go to dashboard
            </button>
          </div>
        ) : (
          <form className="card" style={{ padding: 18 }} onSubmit={create} data-testid="create-household-form">
            <div className="field">
              <label htmlFor="hh-name">Household name</label>
              <input id="hh-name" className="input" data-testid="household-name"
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maple Street Apartment" />
            </div>
            <button type="submit" className="btn primary block" data-testid="create-household-submit">
              Create household
            </button>
          </form>
        )
      ) : (
        <form className="card" style={{ padding: 18 }} onSubmit={join} data-testid="join-household-form">
          <div className="field">
            <label htmlFor="hh-code">Join code</label>
            <input id="hh-code" className="input" data-testid="join-code"
              value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. MAPLE-4827" style={{ textTransform: 'uppercase' }} />
          </div>
          <button type="submit" className="btn primary block" data-testid="join-household-submit">
            Join household
          </button>
        </form>
      )}
    </>
  );
}
