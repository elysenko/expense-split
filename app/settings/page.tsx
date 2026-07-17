'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, buildMemberMap, type HouseholdSummary, type Member } from '@/lib/client';
import { initials } from '@/lib/format';
import { useAuth } from '../providers';

export default function HouseholdSettingsPage() {
  const { user } = useAuth();
  const [households, setHouseholds] = useState<HouseholdSummary[] | null>(null);
  const [current, setCurrent] = useState<HouseholdSummary | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [copied, setCopied] = useState(false);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function refresh(preferId?: string) {
    const hs = await api.listHouseholds();
    setHouseholds(hs);
    const chosen = (preferId && hs.find((h) => h.id === preferId)) || hs[0] || null;
    setCurrent(chosen);
    if (chosen) setMembers(await api.listMembers(chosen.id));
    else setMembers([]);
  }

  useEffect(() => {
    refresh().catch(() => setHouseholds([]));
  }, []);

  function copyCode() {
    if (!current) return;
    setCopied(true);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(current.joinCode).catch(() => {});
    }
    setNotice(`Join code ${current.joinCode} copied — share it with a roommate.`);
  }

  async function createHousehold(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!newName.trim()) return setError('Enter a household name first.');
    try {
      const created = await api.createHousehold(newName.trim());
      setNewName('');
      setNotice(`Created “${created.name}”.`);
      await refresh(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create household.');
    }
  }

  async function joinHousehold(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!joinCode.trim()) return setError('Enter a join code first.');
    try {
      const joined = await api.joinHousehold(joinCode.trim().toUpperCase());
      setJoinCode('');
      setNotice(`Joined “${joined.name}”.`);
      await refresh(joined.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join household.');
    }
  }

  if (households === null) {
    return <div className="card"><div className="empty">Loading…</div></div>;
  }

  const memberMap = buildMemberMap(members);

  return (
    <div>
      <div className="section">
        <h1 style={{ fontSize: 22 }}>Household</h1>
        <p className="muted small">{current ? current.name : 'No household selected'}</p>
      </div>

      {current && (
        <>
          <section className="section">
            <div className="section-head"><h2>Invite code</h2></div>
            <div className="card" style={{ padding: 14 }}>
              <div className="joincode">
                <span>{current.joinCode}</span>
                <button className="btn btn-sm btn-primary" onClick={copyCode}>{copied ? 'Copied' : 'Copy'}</button>
              </div>
              <p className="muted small" style={{ marginTop: 10 }}>Roommates enter this 6-character code to join {current.name}.</p>
            </div>
          </section>

          <section className="section">
            <div className="section-head"><h2>Members ({members.length})</h2></div>
            <div className="card list">
              {members.map((m) => (
                <div className="row" key={m.userId}>
                  <span className={`avatar sm ${memberMap[m.userId]?.color ?? 'a1'}`} aria-hidden>{initials(m.name)}</span>
                  <div className="row-main">
                    <div className="row-title">{m.name}{m.userId === user?.id && ' (you)'}</div>
                    <div className="row-sub">{m.email}</div>
                  </div>
                  <span className={`tag ${m.role === 'ADMIN' ? 'info' : 'warn'}`}>{m.role === 'ADMIN' ? 'Admin' : 'Member'}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="section">
        <div className="section-head"><h2>Create a household</h2></div>
        <form className="card" style={{ padding: 14 }} onSubmit={createHousehold}>
          <div className="field">
            <label htmlFor="new-name">Household name</label>
            <input id="new-name" className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Flat 3B" />
          </div>
          <button className="btn btn-primary btn-block" type="submit">Create household</button>
        </form>
      </section>

      <section className="section">
        <div className="section-head"><h2>Join with a code</h2></div>
        <form className="card" style={{ padding: 14 }} onSubmit={joinHousehold}>
          <div className="field">
            <label htmlFor="join-code">Join code</label>
            <input id="join-code" className="input" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="MAPLE7" maxLength={6} style={{ textTransform: 'uppercase' }} />
          </div>
          <button className="btn btn-block" type="submit">Join household</button>
        </form>
      </section>

      {households.length > 0 && (
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
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && !error && <p className="small" style={{ color: 'var(--positive)' }} role="status">{notice}</p>}
    </div>
  );
}
