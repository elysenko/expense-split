// Browser API client for the live backend. Injects the JWT bearer token from
// localStorage on every request and, on a 401 for an authenticated call,
// clears the session and redirects to /login (session expired).

export type Role = 'ADMIN' | 'USER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface HouseholdSummary {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
  lastActivity: string;
}

export interface Household {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface Share {
  userId: string;
  shareCents: number;
}

export interface Expense {
  id: string;
  householdId: string;
  description: string;
  amountCents: number;
  payerId: string;
  createdAt: string;
  shares: Share[];
}

export interface ExpenseDetailResponse {
  expense: {
    id: string;
    householdId: string;
    description: string;
    amountCents: number;
    payerId: string;
    createdAt: string;
  };
  shares: Share[];
}

export interface NetEntry {
  userId: string;
  netCents: number;
}

export interface OweEntry {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

export interface Balances {
  net: NetEntry[];
  owes: OweEntry[];
}

export interface Settlement {
  id: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  createdAt: string;
}

export interface AdminService {
  key: string;
  label: string;
  fields: string[];
  configured: boolean;
  value: string | null;
  source: 'env' | 'db' | null;
}

const TOKEN_KEY = 'splithouse.token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  // Session expired on an authenticated request: drop the token and bounce to
  // login. Unauthenticated 401s (bad credentials on login) fall through so the
  // caller can surface the message.
  if (res.status === 401 && token) {
    clearToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = (data && (data.error as string)) || res.statusText || 'Request failed';
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export interface ExpenseFilters {
  member?: string;
  from?: string;
  to?: string;
}

export const api = {
  // --- auth ---
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  signup: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/signup', { method: 'POST', body: { name, email, password } }),
  me: () => request<AuthUser>('/auth/me'),

  // --- households ---
  listHouseholds: () => request<HouseholdSummary[]>('/households'),
  createHousehold: (name: string) =>
    request<Household>('/households', { method: 'POST', body: { name } }),
  joinHousehold: (joinCode: string) =>
    request<Household>('/households/join', { method: 'POST', body: { joinCode } }),
  getHousehold: (id: string) => request<Household>(`/households/${id}`),
  listMembers: (id: string) => request<Member[]>(`/households/${id}/members`),

  // --- expenses ---
  listExpenses: (householdId: string, filters: ExpenseFilters = {}) => {
    const q = new URLSearchParams();
    if (filters.member) q.set('member', filters.member);
    if (filters.from) q.set('from', filters.from);
    if (filters.to) q.set('to', filters.to);
    const qs = q.toString();
    return request<Expense[]>(`/households/${householdId}/expenses${qs ? `?${qs}` : ''}`);
  },
  createExpense: (
    householdId: string,
    body: { description: string; amountCents: number; payerId: string; memberIds: string[] },
  ) => request<Expense>(`/households/${householdId}/expenses`, { method: 'POST', body }),
  getExpense: (id: string) => request<ExpenseDetailResponse>(`/expenses/${id}`),

  // --- balances & settlements ---
  getBalances: (householdId: string) => request<Balances>(`/households/${householdId}/balances`),
  listSettlements: (householdId: string) =>
    request<Settlement[]>(`/households/${householdId}/settlements`),
  createSettlement: (
    householdId: string,
    body: { fromUserId: string; toUserId: string; amountCents: number },
  ) => request<Settlement>(`/households/${householdId}/settlements`, { method: 'POST', body }),

  // --- admin ---
  adminGetSettings: () => request<{ services: AdminService[] }>('/admin/settings'),
  adminPatchSettings: (body: Record<string, Record<string, string>>) =>
    request<{ ok: true }>('/admin/settings', { method: 'PATCH', body }),
};

// A member lookup with a stable palette color per member, built from the
// household roster so components can render names/initials/avatars for any id.
export interface MemberInfo extends Member {
  color: string;
}

export function buildMemberMap(members: Member[]): Record<string, MemberInfo> {
  const map: Record<string, MemberInfo> = {};
  members.forEach((m, i) => {
    map[m.userId] = { ...m, color: `a${(i % 3) + 1}` };
  });
  return map;
}
