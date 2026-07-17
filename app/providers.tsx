'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { users, type User } from '@/lib/mock';
import AppShell from './components/AppShell';

interface AuthState {
  user: User;
  loggedIn: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside Providers');
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Preview starts signed in as the demo ADMIN so guarded screens render.
  const [user, setUser] = useState<User>(users[0]);
  const [loggedIn, setLoggedIn] = useState(true);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loggedIn,
      login: (email: string) => {
        const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        setUser(found ?? users[0]);
        setLoggedIn(true);
      },
      logout: () => setLoggedIn(false),
    }),
    [user, loggedIn],
  );

  return (
    <AuthCtx.Provider value={value}>
      <AppShell>{children}</AppShell>
    </AuthCtx.Provider>
  );
}
