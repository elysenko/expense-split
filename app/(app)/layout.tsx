import React from 'react';
import Nav from '@/components/Nav';

// In the real app this is a server guard: getCurrentUser() → redirect to
// /login (no session) or /onboarding (no membership). The mockup renders the
// authenticated shell directly so every screen is reachable in the preview.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Nav />
      <main className="app-main">{children}</main>
    </div>
  );
}
