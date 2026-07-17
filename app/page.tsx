'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type HouseholdSummary } from '@/lib/client';
import { useAuth } from './providers';
import EmptyState from './components/EmptyState';

export default function Home() {
  const { user } = useAuth();
  const [households, setHouseholds] = useState<HouseholdSummary[] | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) {
      setHouseholds(null);
      return;
    }
    let active = true;
    api
      .listHouseholds()
      .then((hs) => active && setHouseholds(hs))
      .catch(() => active && setHouseholds([]));
    return () => {
      active = false;
    };
  }, [user]);

  // Public landing page for logged-out visitors. This is the deployed root and
  // carries the `home-main` readiness landmark that the post-deploy render gate
  // waits for — so it must render without a session.
  if (!user) {
    return (
      <div data-testid="home-main">
        <section className="section">
          <h1 style={{ fontSize: 28 }}>Splithouse</h1>
          <p className="muted">
            Split rent, bills and groceries with your roommates — track who paid,
            who owes whom, and settle up in a tap.
          </p>
        </section>
        <div className="card">
          <EmptyState
            emoji="🏠"
            title="Share expenses with your housemates"
            subtitle="Create a household, add expenses, and watch everyone's balance update instantly."
          />
          <div className="grid-2 section" style={{ marginTop: 12 }}>
            <Link className="btn btn-primary" href="/login">Log in</Link>
            <Link className="btn" href="/signup">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  if (households === null) {
    return (
      <div data-testid="home-main">
        <div className="card"><div className="empty">Loading…</div></div>
      </div>
    );
  }

  const mine = households;

  return (
    <div data-testid="home-main">
      <div className="section">
        <h1 style={{ fontSize: 24 }}>Welcome back 👋</h1>
        <p className="muted">Pick up where you left off or start a new household.</p>
      </div>

      {!showOnboarding && mine.length > 0 ? (
        <section className="section">
          <div className="section-head"><h2>Your households</h2></div>
          <div className="card list">
            {mine.map((h) => (
              <Link key={h.id} href={`/households/${h.id}`} className="row">
                <span className="brand-badge" aria-hidden>{h.name[0]}</span>
                <div className="row-main">
                  <div className="row-title">{h.name}</div>
                  <div className="row-sub">code {h.joinCode}</div>
                </div>
                <span className="tag info">Open</span>
              </Link>
            ))}
          </div>
          <button className="btn btn-block" style={{ marginTop: 12 }} onClick={() => setShowOnboarding(true)}>
            + Create or join another household
          </button>
        </section>
      ) : (
        <section className="section">
          <div className="card">
            <EmptyState
              emoji="🏡"
              title="Let's set up your first household"
              subtitle="Create a household and invite roommates, or join one with a code."
            />
          </div>
          <div className="grid-2 section" style={{ marginTop: 12 }}>
            <Link className="btn btn-primary" href="/settings">Create household</Link>
            <Link className="btn" href="/settings">Join with code</Link>
          </div>
          {mine.length > 0 && (
            <button className="btn-ghost" onClick={() => setShowOnboarding(false)}>← Back to my households</button>
          )}
        </section>
      )}
    </div>
  );
}
