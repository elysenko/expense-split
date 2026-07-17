'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name.');
    if (!email.trim()) return setError('Enter your email.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setError('');
    setBusy(true);
    try {
      await signup(name.trim(), email.trim(), password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-logo"><span className="brand-badge">S</span> Splithouse</div>
      <p className="auth-sub">Create an account to start splitting expenses.</p>
      <form className="card" style={{ padding: 18 }} onSubmit={submit}>
        <h2 style={{ marginBottom: 14 }}>Sign up</h2>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" type="submit" style={{ marginTop: 6 }} disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="auth-alt">Already have an account? <Link className="btn-ghost" href="/login">Log in</Link></p>
      </form>
      <div className="demo-box">The first person to sign up becomes the household <strong>admin</strong>; everyone who joins later is a member.</div>
    </div>
  );
}
