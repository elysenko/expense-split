'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../providers';
import { initials } from '@/lib/format';
import { api } from '@/lib/client';

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
const HouseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V9l8-5 8 5v12" /><path d="M9 21v-6h6v6" /></svg>
);
const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.4-2.6H10l-.4 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4L5.6 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z" /></svg>
);

interface NavItem { href: string; label: string; icon: React.ReactNode; adminOnly?: boolean; match: (path: string) => boolean; }

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [dashboardHref, setDashboardHref] = useState('/');

  const bare = pathname === '/login' || pathname === '/signup';
  const isHome = pathname === '/';
  // Public routes render without a session: login/signup are bare, and `/` is a
  // public landing page so the post-deploy render gate can reach `home-main`.
  const publicRoute = bare || isHome;

  // Redirect unauthenticated users away from guarded routes once auth resolves.
  useEffect(() => {
    if (!loading && !user && !publicRoute) router.replace('/login');
  }, [loading, user, publicRoute, router]);

  // Point the Dashboard tab at the user's most-recently-active household.
  useEffect(() => {
    if (!user) return;
    let active = true;
    api
      .listHouseholds()
      .then((hs) => {
        if (active && hs.length > 0) setDashboardHref(`/households/${hs[0].id}`);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  if (bare) return <>{children}</>;

  // Logged-out visitor on the public landing (`/`): render the page with a
  // minimal header (Log in CTA) and no authed bottom-nav.
  if (!loading && !user && isHome) {
    return (
      <div className="shell">
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="brand-badge">S</span>
            <span>Splithouse</span>
          </Link>
          <Link href="/login" className="chip-btn">Log in</Link>
        </header>
        <main className="content">{children}</main>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="shell">
        <main className="content">
          <div className="card"><div className="empty">Loading…</div></div>
        </main>
      </div>
    );
  }

  const NAV: NavItem[] = [
    { href: dashboardHref, label: 'Dashboard', icon: <HomeIcon />, match: (p) => p === '/' || p.startsWith('/households') },
    { href: '/history', label: 'History', icon: <ClockIcon />, match: (p) => p.startsWith('/history') || p.startsWith('/expenses') },
    { href: '/settings', label: 'Household', icon: <HouseIcon />, match: (p) => p.startsWith('/settings') },
    { href: '/admin/settings', label: 'Admin', icon: <GearIcon />, adminOnly: true, match: (p) => p.startsWith('/admin') },
  ];

  const items = NAV.filter((n) => !n.adminOnly || user.role === 'ADMIN');

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-badge">S</span>
          <span>Splithouse</span>
        </Link>
        <div className="topbar-user">
          <span className="avatar sm a1" title={user.name}>{initials(user.name)}</span>
          <button className="chip-btn" onClick={() => { logout(); router.push('/login'); }}>Log out</button>
        </div>
      </header>

      <main className="content">{children}</main>

      <nav className="bottom-nav" aria-label="Primary">
        {items.map((n) => {
          const active = n.match(pathname);
          return (
            <Link key={n.label} href={n.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
              {n.icon}
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
