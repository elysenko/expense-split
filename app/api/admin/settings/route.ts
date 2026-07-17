import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Infra/service keys surfaced in the admin settings panel. Effective value is
// resolved env-first, then the SystemSetting DB row.
const KNOWN_KEYS = [
  'DATABASE_URL',
  'MINIO_ENDPOINT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
] as const;

const PLACEHOLDER = 'PLACEHOLDER_CONFIGURE_IN_SETTINGS';

async function requireAdmin() {
  const ctx = await getCurrentUser();
  if (!ctx) return { error: NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }) };
  if (ctx.user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Admin access required.' }, { status: 403 }) };
  }
  return { ctx };
}

export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const rows = await prisma.systemSetting.findMany();
  const dbMap = new Map(rows.map((r) => [r.key, r]));
  const keys = new Set<string>([...KNOWN_KEYS, ...dbMap.keys()]);

  const settings = Array.from(keys)
    .sort()
    .map((key) => {
      const envVal = process.env[key];
      const dbRow = dbMap.get(key);
      const envGood = !!envVal && envVal !== PLACEHOLDER;
      const dbGood = !!dbRow?.value && dbRow.value !== PLACEHOLDER;
      const value = envGood ? envVal! : dbGood ? dbRow!.value : null;
      const source = envGood ? 'env' : dbGood ? 'db' : null;
      return { key, configured: !!value, source, updatedAt: dbRow?.updatedAt ?? null };
    });

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let body: { key?: unknown; value?: unknown } | Array<{ key?: unknown; value?: unknown }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const items = Array.isArray(body) ? body : [body];
  const updates = items
    .map((it) => ({
      key: typeof it.key === 'string' ? it.key : '',
      value: typeof it.value === 'string' ? it.value : '',
    }))
    .filter((it) => it.key);

  if (updates.length === 0) {
    return NextResponse.json({ error: 'Provide at least one key/value.' }, { status: 400 });
  }

  await Promise.all(
    updates.map((u) =>
      prisma.systemSetting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
