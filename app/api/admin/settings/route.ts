import { prisma } from '@/lib/db';
import { json, error, auth } from '@/lib/api';
import { ADMIN_SERVICES, settingKey, envConfigured } from '@/lib/config';

function requireAdmin(req: Request) {
  const a = auth(req);
  if ('res' in a) return { res: a.res };
  if (a.session.role !== 'ADMIN') return { res: error('Forbidden', 403) };
  return { session: a.session };
}

const MASK = '••••••••';

// GET /api/admin/settings — service config status (ADMIN only). Values masked.
export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if ('res' in guard) return guard.res;

  const rows = await prisma.systemSetting.findMany();
  const dbKeys = new Set(rows.map((r) => r.key));

  const services = ADMIN_SERVICES.map((def) => {
    const fromEnv = envConfigured(def);
    const fromDb = dbKeys.has(settingKey(def.key));
    const configured = fromEnv || fromDb;
    return {
      key: def.key,
      label: def.label,
      fields: def.fields,
      configured,
      value: configured ? MASK : null,
      source: fromEnv ? 'env' : fromDb ? 'db' : null,
    };
  });

  return json({ services });
}

// PATCH /api/admin/settings — upsert service config (ADMIN only).
export async function PATCH(req: Request) {
  const guard = requireAdmin(req);
  if ('res' in guard) return guard.res;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return error('Invalid JSON body', 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return error('Body must be an object of { serviceKey: config }', 400);

  const known = new Set(ADMIN_SERVICES.map((s) => s.key));
  const entries = Object.entries(body);
  if (entries.length === 0) return error('No settings provided', 400);

  // Validate everything before writing anything (reject leaves DB untouched).
  for (const [key, val] of entries) {
    if (!known.has(key)) return error(`Unknown service key: ${key}`, 400);
    if (val === null || typeof val !== 'object' || Array.isArray(val))
      return error(`Config for ${key} must be an object`, 400);
  }

  await prisma.$transaction(
    entries.map(([key, val]) =>
      prisma.systemSetting.upsert({
        where: { key: settingKey(key) },
        update: { value: JSON.stringify(val) },
        create: { key: settingKey(key), value: JSON.stringify(val) },
      }),
    ),
  );

  return json({ ok: true });
}
