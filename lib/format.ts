// Pure presentation helpers shared by client components. No data, no I/O — the
// live app renders real API data through these.

export function fmt(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

export function initials(name: string): string {
  return (name || '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// The approved design ships three avatar palette colors (.avatar.a1..a3). Map a
// member's position within the household to one of them so avatars stay colorful
// even though real user ids are uuids.
export function avatarColor(index: number): string {
  return `a${(index % 3) + 1}`;
}

export function dateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function dateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
