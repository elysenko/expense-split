'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { households, householdById, initials, membersOf } from '@/lib/mock';
import { useAuth } from '../providers';

export default function HouseholdSettingsPage() {
  const { user } = useAuth();
  const household = householdById('h1')!;
  const members = membersOf(household);
  const [copied, setCopied] = useState(false);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [notice, setNotice] = useState('');

  function copyCode() {
    setCopied(true);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(household.joinCode).catch(() => {});
    }
    setNotice(`Join code ${household.joinCode} copied — share it with a roommate.`);
  }

  return (
    <div>
      <div className="section">
        <h1 style={{ fontSize: 22 }}>Household</h1>
        <p className="muted small">{household.name}</p>
      </div>

      <section className="section">
        <div className="section-head"><h2>Invite code</h2></div>
        <div className="card" style={{ padding: 14 }}>
          <div className="joincode">
            <span>{household.joinCode}</span>
            <button className="btn btn-sm btn-primary" onClick={copyCode}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <p className="muted small" style={{ marginTop: 10 }}>Roommates enter this 6-character code to join {household.name}.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Members ({members.length})</h2></div>
        <div className="card list">
          {members.map((m) => (
            <div className="row" key={m.id}>
              <span className={`avatar sm a${m.id.replace('u', '')}`} aria-hidden>{initials(m.name)}</span>
              <div className="row-main">
                <div className="row-title">{m.name}{m.id === user.id && ' (you)'}</div>
                <div className="row-sub">{m.email}</div>
              </div>
              <span className={`tag ${m.role === 'ADMIN' ? 'info' : 'warn'}`}>{m.role === 'ADMIN' ? 'Admin' : 'Member'}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Create a household</h2></div>
        <form className="card" style={{ padding: 14 }} onSubmit={(e) => { e.preventDefault(); setNotice(newName ? `Created “${newName}”.` : 'Enter a name first.'); }}>
          <div className="field">
            <label htmlFor="new-name">Household name</label>
            <input id="new-name" className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Flat 3B" />
          </div>
          <button className="btn btn-primary btn-block" type="submit">Create household</button>
        </form>
      </section>

      <section className="section">
        <div className="section-head"><h2>Join with a code</h2></div>
        <form className="card" style={{ padding: 14 }} onSubmit={(e) => { e.preventDefault(); setNotice(joinCode ? `Joined household with code ${joinCode.toUpperCase()}.` : 'Enter a join code first.'); }}>
          <div className="field">
            <label htmlFor="join-code">Join code</label>
            <input id="join-code" className="input" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="MAPLE7" maxLength={6} style={{ textTransform: 'uppercase' }} />
          </div>
          <button className="btn btn-block" type="submit">Join household</button>
        </form>
      </section>

      <section className="section">
        <div className="section-head"><h2>Switch household</h2></div>
        <div className="card list">
          {households.map((h) => (
            <Link key={h.id} href={`/households/${h.id}`} className="row">
              <span className="brand-badge" aria-hidden>{h.name[0]}</span>
              <div className="row-main"><div className="row-title">{h.name}</div><div className="row-sub">code {h.joinCode}</div></div>
              <span className="tag info">Open</span>
            </Link>
          ))}
        </div>
      </section>

      {notice && <p className="small" style={{ color: 'var(--positive)' }} role="status">{notice}</p>}
    </div>
  );
}
