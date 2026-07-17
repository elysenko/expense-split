'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, clearToken, type AuthUser } from '@/lib/client';
import AppShell from './components/AppShell';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside Providers');
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from a stored token on first load.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.me();
        if (active) setUser(me);
      } catch {
        clearToken();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const res = await api.login(email, password);
        setToken(res.token);
        setUser(res.user);
      },
      signup: async (name, email, password) => {
        const res = await api.signup(name, email, password);
        setToken(res.token);
        setUser(res.user);
      },
      logout: () => {
        clearToken();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return (
    <AuthCtx.Provider value={value}>
      <AppShell>{children}</AppShell>
    </AuthCtx.Provider>
  );
}
