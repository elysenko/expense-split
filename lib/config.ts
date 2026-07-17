// Config resolver: env var takes priority, then a SystemSetting DB row, else null.
// Admin service registry drives the /api/admin/settings surface.
import { prisma } from './db';

const PLACEHOLDER = 'PLACEHOLDER_CONFIGURE_IN_SETTINGS';

export class ServiceUnconfiguredError extends Error {
  status = 503;
  constructor(key: string) {
    super(`Service not configured: ${key}`);
    this.name = 'ServiceUnconfiguredError';
  }
}

export async function resolveConfig(key: string): Promise<string | null> {
  const envVal = process.env[key];
  if (envVal && envVal !== PLACEHOLDER) return envVal;
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (setting?.value && setting.value !== PLACEHOLDER) return setting.value;
  return null;
}

export function isUnconfigured(value: string | null): boolean {
  return !value || value === PLACEHOLDER;
}

// Services shown in the admin settings panel. `envKeys` are the env vars whose
// presence marks the service as configured out of the box.
export interface ServiceDef {
  key: string;
  label: string;
  fields: string[];
  envKeys: string[];
}

export const ADMIN_SERVICES: ServiceDef[] = [
  { key: 'postgresql', label: 'PostgreSQL', fields: ['Host', 'Port', 'Database', 'User', 'Password'], envKeys: ['DATABASE_URL'] },
  { key: 'minio', label: 'MinIO (Object Storage)', fields: ['Endpoint', 'Access Key', 'Secret Key', 'Bucket'], envKeys: ['MINIO_ENDPOINT'] },
  { key: 'llm', label: 'LLM Provider', fields: ['Base URL', 'API Key', 'Model'], envKeys: ['LITELLM_BASE_URL', 'OPENAI_API_KEY'] },
];

export const settingKey = (serviceKey: string) => `service:${serviceKey}`;

export function envConfigured(def: ServiceDef): boolean {
  return def.envKeys.some((k) => {
    const v = process.env[k];
    return !!v && v !== PLACEHOLDER;
  });
}
