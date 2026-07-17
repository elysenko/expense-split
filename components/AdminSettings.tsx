'use client';

import { useCallback, useEffect, useState } from 'react';

interface ServiceField {
  name: string;
  label: string;
  placeholder?: string;
}

interface Service {
  key: string;
  label: string;
  fields: ServiceField[];
}

// Static field layout per provisioned service; the effective/configured state
// is loaded from the real backend (GET /api/admin/settings), not mocked.
const SERVICES: Service[] = [
  {
    key: 'postgresql',
    label: 'postgresql',
    fields: [{ name: 'DATABASE_URL', label: 'Connection URL', placeholder: 'postgresql://user:pass@host:5432/app' }],
  },
  {
    key: 'minio',
    label: 'minio',
    fields: [
      { name: 'MINIO_ENDPOINT', label: 'Endpoint' },
      { name: 'MINIO_ACCESS_KEY', label: 'Access key' },
      { name: 'MINIO_SECRET_KEY', label: 'Secret key' },
    ],
  },
];

interface SettingRow {
  key: string;
  configured: boolean;
  source: string | null;
  updatedAt: string | null;
}

export default function AdminSettings() {
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings', { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to load settings (${res.status}).`);
      }
      const data: { settings: SettingRow[] } = await res.json();
      const map: Record<string, boolean> = {};
      for (const row of data.settings) map[row.key] = row.configured;
      setConfigured(map);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isConfigured = (service: Service) => service.fields.every((f) => configured[f.name]);

  const save = async (e: React.FormEvent, service: Service) => {
    e.preventDefault();
    setSaving(service.key);
    setSaved(null);
    setError(null);
    try {
      const updates = service.fields
        .map((f) => ({ key: f.name, value: values[f.name] ?? '' }))
        .filter((u) => u.value.length > 0);
      if (updates.length === 0) {
        setError('Enter a value before saving.');
        return;
      }
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Save failed (${res.status}).`);
      }
      // Clear the just-saved secret inputs and refresh configured state.
      setValues((prev) => {
        const next = { ...prev };
        for (const f of service.fields) delete next[f.name];
        return next;
      });
      await load();
      setSaved(service.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="card">
      {error && (
        <p className="badge warn" data-testid="admin-settings-error" role="alert">
          {error}
        </p>
      )}
      {SERVICES.map((s) => {
        const ok = isConfigured(s);
        return (
          <form key={s.key} className="service-row" onSubmit={(e) => save(e, s)} data-testid={`service-${s.key}`}>
            <div className="top">
              <span className="name">{s.label}</span>
              <span className={`badge ${ok ? 'ok' : 'warn'}`}>
                {loading ? 'Loading…' : ok ? 'Configured' : 'Not configured'}
              </span>
            </div>
            {s.fields.map((f) => (
              <div className="field" key={f.name}>
                <label htmlFor={`${s.key}-${f.name}`}>{f.label}</label>
                <input
                  id={`${s.key}-${f.name}`}
                  data-testid={`input-${f.name}`}
                  className="input"
                  type={
                    f.name.toLowerCase().includes('secret') || f.name.toLowerCase().includes('url')
                      ? 'password'
                      : 'text'
                  }
                  placeholder={configured[f.name] ? 'Configured — enter to replace' : f.placeholder ?? 'Not set'}
                  value={values[f.name] ?? ''}
                  onChange={(ev) => {
                    setSaved(null);
                    setValues((prev) => ({ ...prev, [f.name]: ev.target.value }));
                  }}
                />
              </div>
            ))}
            <button type="submit" className="btn primary sm" disabled={saving === s.key}>
              {saving === s.key ? 'Saving…' : saved === s.key ? 'Saved ✓' : 'Save credentials'}
            </button>
          </form>
        );
      })}
    </div>
  );
}
