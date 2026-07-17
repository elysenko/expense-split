import JoinCodeBox from '@/components/JoinCodeBox';
import LogoutButton from '@/components/LogoutButton';
import { requireSession, loadHouseholdMembers } from '@/lib/session';

export const metadata = { title: 'Settings — SplitMate' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { user, household } = await requireSession();
  const members = await loadHouseholdMembers(household.id);

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
          <div className="kv"><span className="k">Name</span><span className="v">{household.name}</span></div>
          <div className="kv"><span className="k">Members</span><span className="v">{members.length}</span></div>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Invite roommates</h2></div>
        <p className="page-sub" style={{ marginBottom: 10 }}>
          Share this code so roommates can join your household.
        </p>
        <JoinCodeBox code={household.joinCode} />
      </section>

      <section className="section">
        <div className="section-head"><h2>Members</h2></div>
        <div className="card">
          {members.map((m) => (
            <div key={m.id} className="member-net">
              <span className="avatar sm" aria-hidden>{m.initials}</span>
              <span className="who">
                {m.name}{m.id === user.id ? ' (you)' : ''}
                <div className="meta" style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.8rem' }}>{m.email}</div>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <LogoutButton className="btn ghost block" />
      </section>
    </div>
  );
}
