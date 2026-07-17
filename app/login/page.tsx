'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('alex@maple.test');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return setError('Enter your email and password.');
    login(email);
    router.push('/');
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
        <button className="btn btn-primary btn-block" type="submit" style={{ marginTop: 6 }}>Log in</button>
        <p className="auth-alt">New here? <Link className="btn-ghost" href="/signup">Create an account</Link></p>
      </form>
      <div className="demo-box">
        <strong>Demo logins</strong>
        <div>Admin: <code>alex@maple.test</code></div>
        <div>Member: <code>bailey@maple.test</code> · <code>casey@maple.test</code></div>
        <div>Password: <code>demo1234</code></div>
      </div>
    </div>
  );
}
