import Link from 'next/link';
import JoinCodeBox from '@/components/JoinCodeBox';
import { HOUSEHOLD, MEMBERS, CURRENT_USER_ID } from '@/lib/mockData';

export const metadata = { title: 'Settings — SplitMate' };

export default function SettingsPage() {
  return (
    <div data-testid="settings-main">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="page-sub">Manage your household</p>
        </div>
      </div>

      <section className="section">
        <div className="section-head"><h2>Household</h2></div>
        <div className="card">
          <div className="kv"><span className="k">Name</span><span className="v">{HOUSEHOLD.name}</span></div>
          <div className="kv"><span className="k">Members</span><span className="v">{MEMBERS.length}</span></div>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Invite roommates</h2></div>
        <p className="page-sub" style={{ marginBottom: 10 }}>
          Share this code so roommates can join your household.
        </p>
        <JoinCodeBox code={HOUSEHOLD.joinCode} />
      </section>

      <section className="section">
        <div className="section-head"><h2>Members</h2></div>
        <div className="card">
          {MEMBERS.map((m) => (
            <div key={m.id} className="member-net">
              <span className="avatar sm" aria-hidden>{m.initials}</span>
              <span className="who">
                {m.name}{m.id === CURRENT_USER_ID ? ' (you)' : ''}
                <div className="meta" style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.8rem' }}>{m.email}</div>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <Link href="/login" className="btn ghost block">Log out</Link>
      </section>
    </div>
  );
}
