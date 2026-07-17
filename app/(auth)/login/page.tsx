import Link from 'next/link';
import LoginForm from '@/components/LoginForm';

export const metadata = { title: 'Log in — SplitMate' };

export default function LoginPage() {
  return (
    <main className="auth-wrap" data-testid="login-main">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">₴</span>
          <h1>Welcome back</h1>
          <p>Log in to track and split your household expenses.</p>
        </div>
        <LoginForm />
        <div className="demo-hint">
          <b>Demo login:</b> use <b>alex@example.com</b> with any password to explore the seeded household.
        </div>
        <p className="auth-foot">
          New here? <Link href="/signup">Create an account</Link>
        </p>
        <p className="auth-foot">
          <Link href="/admin/login">Admin sign in</Link>
        </p>
      </div>
    </main>
  );
}
