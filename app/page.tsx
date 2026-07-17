'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { households, membersOf } from '@/lib/mock';
import EmptyState from './components/EmptyState';

export default function Home() {
  // In the real app the root redirects to the most-recent household or, when
  // the user belongs to none, shows this onboarding. The preview shows both so
  // every path is reachable.
  const [showOnboarding, setShowOnboarding] = useState(false);
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
                  <div className="row-sub">{membersOf(h).length} members · code {h.joinCode}</div>
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
