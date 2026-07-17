'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Fill in every field to create your account.');
      return;
    }
    if (password.length < 6) {
      setError('Use a password with at least 6 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaving(false);
        return setError(data.error || 'Could not create your account.');
      }
      router.push(data.redirect || '/onboarding');
      router.refresh();
    } catch {
      setSaving(false);
      setError('Could not create your account.');
    }
  };

  return (
    <form onSubmit={submit} data-testid="signup-form">
      {error && <div className="form-error">{error}</div>}
      <div className="field">
        <label htmlFor="su-name">Name</label>
        <input id="su-name" className="input" data-testid="signup-name"
          value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </div>
      <div className="field">
        <label htmlFor="su-email">Email</label>
        <input id="su-email" className="input" type="email" autoComplete="email"
          data-testid="signup-email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="su-password">Password</label>
        <input id="su-password" className="input" type="password" autoComplete="new-password"
          data-testid="signup-password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters" />
      </div>
      <button type="submit" className="btn primary block" data-testid="signup-submit" disabled={saving}>
        {saving ? 'Creating…' : 'Create account'}
      </button>
    </form>
  );
}
