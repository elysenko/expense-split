'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ADMIN_SERVICES } from '@/lib/mock';
import { useAuth } from '../../providers';
import EmptyState from '../../components/EmptyState';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  if (user.role !== 'ADMIN') {
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

      <div className="list card">
        {ADMIN_SERVICES.map((svc) => (
          <div key={svc.key} style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="row" style={{ borderBottom: 'none' }}>
              <div className="row-main">
                <div className="row-title">{svc.label}</div>
                <div className="row-sub">{svc.fields.length} credential fields</div>
              </div>
              <span className={`tag ${svc.configured ? 'pos' : 'warn'}`}>{svc.configured ? 'Configured' : 'Not set'}</span>
              <button className="btn btn-sm" style={{ marginLeft: 10 }} onClick={() => setOpenKey(openKey === svc.key ? null : svc.key)}>
                {openKey === svc.key ? 'Close' : 'Edit'}
              </button>
            </div>
            {openKey === svc.key && (
              <form
                style={{ padding: '4px 14px 16px' }}
                onSubmit={(e) => { e.preventDefault(); setNotice(`${svc.label} settings saved.`); setOpenKey(null); }}
              >
                {svc.fields.map((f) => (
                  <div className="field" key={f}>
                    <label htmlFor={`${svc.key}-${f}`}>{f}</label>
                    <input
                      id={`${svc.key}-${f}`}
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

      {notice && <p className="small" style={{ color: 'var(--positive)', marginTop: 12 }} role="status">{notice}</p>}
    </div>
  );
}
