'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return setError('Enter your email and password.');
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-logo"><span className="brand-badge">S</span> Splithouse</div>
      <p className="auth-sub">Split rent, bills &amp; groceries with your roommates.</p>
      <form className="card" style={{ padding: 18 }} onSubmit={submit}>
        <h2 style={{ marginBottom: 14 }}>Log in</h2>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" type="submit" style={{ marginTop: 6 }} disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="auth-alt">New here? <Link className="btn-ghost" href="/signup">Create an account</Link></p>
      </form>
    </div>
  );
}
