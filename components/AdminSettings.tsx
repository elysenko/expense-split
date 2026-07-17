'use client';

import { useState } from 'react';

interface Service {
  key: string;
  label: string;
  fields: { name: string; label: string; masked?: string }[];
  configured: boolean;
}

const SERVICES: Service[] = [
  {
    key: 'postgresql',
    label: 'postgresql',
    configured: true,
    fields: [{ name: 'DATABASE_URL', label: 'Connection URL', masked: 'postgresql://••••••@••••:5432/app' }],
  },
  {
    key: 'minio',
    label: 'minio',
    configured: false,
    fields: [
      { name: 'MINIO_ENDPOINT', label: 'Endpoint' },
      { name: 'MINIO_ACCESS_KEY', label: 'Access key' },
      { name: 'MINIO_SECRET_KEY', label: 'Secret key' },
    ],
  },
];

export default function AdminSettings() {
  const [saved, setSaved] = useState<string | null>(null);

  const save = (e: React.FormEvent, key: string) => {
    e.preventDefault();
    // Mockup: real app PATCHes /api/admin/settings (upsert into SystemSetting).
    setSaved(key);
    setTimeout(() => setSaved(null), 1500);
  };

  return (
    <div className="card">
      {SERVICES.map((s) => (
        <form key={s.key} className="service-row" onSubmit={(e) => save(e, s.key)} data-testid={`service-${s.key}`}>
          <div className="top">
            <span className="name">{s.label}</span>
            <span className={`badge ${s.configured ? 'ok' : 'warn'}`}>
              {s.configured ? 'Configured' : 'Not configured'}
            </span>
          </div>
          {s.fields.map((f) => (
            <div className="field" key={f.name}>
              <label htmlFor={`${s.key}-${f.name}`}>{f.label}</label>
              <input id={`${s.key}-${f.name}`} className="input"
                type={f.name.toLowerCase().includes('secret') || f.name.toLowerCase().includes('url') ? 'password' : 'text'}
                placeholder={f.masked ?? 'Not set'} defaultValue="" />
            </div>
          ))}
          <button type="submit" className="btn primary sm">
            {saved === s.key ? 'Saved ✓' : 'Save credentials'}
          </button>
        </form>
      ))}
    </div>
  );
}
