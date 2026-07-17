'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HOUSEHOLD } from '@/lib/mockData';

const TABS = [
  { href: '/dashboard', label: 'Home', ico: '🏠' },
  { href: '/history', label: 'History', ico: '📜' },
  { href: '/settings', label: 'Settings', ico: '⚙️' },
];

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <header className="topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">₴</span>
          <span>SplitMate</span>
        </Link>
        <span className="household-name">· {HOUSEHOLD.name}</span>
        <span className="spacer" />
        <nav className="top-links">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className={isActive(t.href) ? 'active' : ''}>
              {t.label}
            </Link>
          ))}
          <Link href="/login">Log out</Link>
        </nav>
      </header>

      <nav className="tabbar" aria-label="Primary">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={isActive(t.href) ? 'active' : ''}>
            <span className="ico" aria-hidden>{t.ico}</span>
            <span>{t.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
