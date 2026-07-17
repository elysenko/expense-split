import React from 'react';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import { getCurrentUser } from '@/lib/session';

// Server guard for the authenticated app. No session → /login. Runs in the Node
// runtime (server component) so jsonwebtoken can verify the cookie. The
// household check lives in the individual pages (requireSession) so /onboarding,
// which is also in this group, stays reachable for users without a household —
// otherwise a household guard here would redirect-loop onto itself.
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentUser();
  if (!ctx) redirect('/login');

  // Onboarding (no household yet) renders without the household nav shell.
  if (!ctx.household) {
    return <main className="app-main">{children}</main>;
  }

  return (
    <div className="app-shell">
      <Nav householdName={ctx.household.name} />
      <main className="app-main">{children}</main>
    </div>
  );
}
