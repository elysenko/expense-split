import Link from 'next/link';
import AdminSettings from '@/components/AdminSettings';

export const metadata = { title: 'Admin settings — SplitMate' };

// Admin-only surface. Real app guards this via the (admin) layout role check.
export default function AdminSettingsPage() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">🛡️</span>
          <span>Admin</span>
        </Link>
        <span className="spacer" />
        <nav className="top-links" style={{ display: 'flex' }}>
          <Link href="/dashboard">Back to app</Link>
          <Link href="/login">Log out</Link>
        </nav>
      </header>
      <main className="app-main" style={{ paddingBottom: 40 }} data-testid="admin-settings-main">
        <div className="page-head">
          <div>
            <h1>Service settings</h1>
            <p className="page-sub">Configure credentials for provisioned services</p>
          </div>
        </div>
        <AdminSettings />
      </main>
    </div>
  );
}
