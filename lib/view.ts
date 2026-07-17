// Shared view types + formatting helpers used by server pages and the client
// components they hydrate. These are pure (no DB), so client components can
// import them safely. Server pages map Prisma rows into these shapes.

export interface Member {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export interface Expense {
  id: string;
  description: string;
  amountCents: number;
  payerId: string;
  createdAt: string; // ISO date
  memberIds: string[]; // who splits it
}

export interface Settlement {
  id: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  createdAt: string;
}

export interface Pairwise {
  fromId: string;
  toId: string;
  amountCents: number;
}

export interface Balances {
  net: Record<string, number>; // positive = owed to member, negative = member owes
  pairwise: Pairwise[];
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function memberById(members: Member[], id: string): Member | undefined {
  return members.find((m) => m.id === id);
}

export function memberName(members: Member[], id: string): string {
  return memberById(members, id)?.name ?? 'Unknown';
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
