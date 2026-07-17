import Link from 'next/link';
import LoginForm from '@/components/LoginForm';

export const metadata = { title: 'Admin sign in — SplitMate' };

export default function AdminLoginPage() {
  return (
    <main className="auth-wrap" data-testid="admin-login-main">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">🛡️</span>
          <h1>Admin sign in</h1>
          <p>Manage service credentials and household settings.</p>
        </div>
        <LoginForm admin />
        <div className="demo-hint">
          <b>Demo admin:</b> <b>admin@example.com</b> with any password.
        </div>
        <p className="auth-foot">
          <Link href="/login">Back to member login</Link>
        </p>
      </div>
    </main>
  );
}
