import Link from 'next/link';
import SignupForm from '@/components/SignupForm';

export const metadata = { title: 'Sign up — SplitMate' };

export default function SignupPage() {
  return (
    <main className="auth-wrap" data-testid="signup-main">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">₴</span>
          <h1>Create your account</h1>
          <p>Split rent, bills, and groceries with your roommates.</p>
        </div>
        <SignupForm />
        <p className="auth-foot">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}
