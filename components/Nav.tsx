'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const TABS = [
  { href: '/dashboard', label: 'Home', ico: '🏠' },
  { href: '/history', label: 'History', ico: '📜' },
  { href: '/settings', label: 'Settings', ico: '⚙️' },
];

export default function Nav({ householdName }: { householdName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const logout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <header className="topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">₴</span>
          <span>SplitMate</span>
        </Link>
        <span className="household-name">· {householdName}</span>
        <span className="spacer" />
        <nav className="top-links">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className={isActive(t.href) ? 'active' : ''}>
              {t.label}
            </Link>
          ))}
          <a href="/login" onClick={logout}>Log out</a>
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
