'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type AdminService } from '@/lib/client';
import { useAuth } from '../../providers';
import EmptyState from '../../components/EmptyState';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<AdminService[] | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    api
      .adminGetSettings()
      .then((r) => setServices(r.services))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load settings.'));
  }, [user]);

  async function save(svc: AdminService, form: HTMLFormElement) {
    setError('');
    const values: Record<string, string> = {};
    svc.fields.forEach((f) => {
      const input = form.elements.namedItem(`${svc.key}-${f}`) as HTMLInputElement | null;
      if (input && input.value.trim()) values[f] = input.value.trim();
    });
    try {
      await api.adminPatchSettings({ [svc.key]: values });
      setNotice(`${svc.label} settings saved.`);
      setOpenKey(null);
      const r = await api.adminGetSettings();
      setServices(r.services);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.');
    }
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="card" data-testid="admin-blocked">
        <EmptyState emoji="🔒" title="Admins only" subtitle="You need an admin account to view service settings." action={<Link className="btn btn-primary" href="/">Back to dashboard</Link>} />
      </div>
    );
  }

  return (
    <div data-testid="admin-main">
      <div className="section">
        <h1 style={{ fontSize: 22 }}>Admin · Service settings</h1>
        <p className="muted small">Configure backing service credentials. Values are masked once saved.</p>
      </div>

      {services === null ? (
        <div className="card"><div className="empty">Loading…</div></div>
      ) : (
        <div className="list card">
          {services.map((svc) => (
            <div key={svc.key} style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="row" style={{ borderBottom: 'none' }}>
                <div className="row-main">
                  <div className="row-title">{svc.label}</div>
                  <div className="row-sub">{svc.fields.length} credential fields{svc.source ? ` · ${svc.source}` : ''}</div>
                </div>
                <span className={`tag ${svc.configured ? 'pos' : 'warn'}`}>{svc.configured ? 'Configured' : 'Not set'}</span>
                <button className="btn btn-sm" style={{ marginLeft: 10 }} onClick={() => setOpenKey(openKey === svc.key ? null : svc.key)}>
                  {openKey === svc.key ? 'Close' : 'Edit'}
                </button>
              </div>
              {openKey === svc.key && (
                <form
                  style={{ padding: '4px 14px 16px' }}
                  onSubmit={(e) => { e.preventDefault(); save(svc, e.currentTarget); }}
                >
                  {svc.fields.map((f) => (
                    <div className="field" key={f}>
                      <label htmlFor={`${svc.key}-${f}`}>{f}</label>
                      <input
                        id={`${svc.key}-${f}`}
                        name={`${svc.key}-${f}`}
                        className="input"
                        type={/key|password|secret/i.test(f) ? 'password' : 'text'}
                        placeholder={svc.configured ? '••••••••' : `Enter ${f.toLowerCase()}`}
                      />
                    </div>
                  ))}
                  <button className="btn btn-primary btn-block" type="submit">Save {svc.label}</button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="form-error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
      {notice && !error && <p className="small" style={{ color: 'var(--positive)', marginTop: 12 }} role="status">{notice}</p>}
    </div>
  );
}
