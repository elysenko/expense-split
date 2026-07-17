'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../providers';
import { initials } from '@/lib/mock';

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

interface NavItem { href: string; label: string; icon: React.ReactNode; adminOnly?: boolean; match: string[]; }

const NAV: NavItem[] = [
  { href: '/households/h1', label: 'Dashboard', icon: <HomeIcon />, match: ['/households'] },
  { href: '/history', label: 'History', icon: <ClockIcon />, match: ['/history', '/expenses'] },
  { href: '/settings', label: 'Household', icon: <HouseIcon />, match: ['/settings'] },
  { href: '/admin/settings', label: 'Admin', icon: <GearIcon />, adminOnly: true, match: ['/admin'] },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { user, loggedIn, logout } = useAuth();

  const bare = pathname === '/login' || pathname === '/signup';
  if (bare) return <>{children}</>;

  const items = NAV.filter((n) => !n.adminOnly || user.role === 'ADMIN');
  const avatarClass = `avatar sm a${(user.id.replace('u', '') || '1')}`;

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-badge">S</span>
          <span>Splithouse</span>
        </Link>
        <div className="topbar-user">
          <span className={avatarClass} title={user.name}>{initials(user.name)}</span>
          {loggedIn ? (
            <button className="chip-btn" onClick={() => { logout(); router.push('/login'); }}>Log out</button>
          ) : (
            <Link href="/login" className="chip-btn">Log in</Link>
          )}
        </div>
      </header>

      <main className="content">{children}</main>

      <nav className="bottom-nav" aria-label="Primary">
        {items.map((n) => {
          const active = n.match.some((m) => pathname.startsWith(m));
          return (
            <Link key={n.href} href={n.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
              {n.icon}
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
