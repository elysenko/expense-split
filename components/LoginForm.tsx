'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState(admin ? 'admin@example.com' : 'alex@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaving(false);
        return setError(data.error || 'Could not log you in.');
      }
      router.push(admin ? '/admin/settings' : data.redirect || '/dashboard');
      router.refresh();
    } catch {
      setSaving(false);
      setError('Could not log you in.');
    }
  };

  return (
    <form onSubmit={submit} data-testid="login-form">
      {error && <div className="form-error">{error}</div>}
      <div className="field">
        <label htmlFor="login-email">Email</label>
        <input id="login-email" className="input" type="email" autoComplete="email"
          data-testid="login-email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="login-password">Password</label>
        <input id="login-password" className="input" type="password" autoComplete="current-password"
          data-testid="login-password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" />
      </div>
      <button type="submit" className="btn primary block" data-testid="login-submit" disabled={saving}>
        {saving ? 'Signing in…' : admin ? 'Sign in as admin' : 'Log in'}
      </button>
    </form>
  );
}
