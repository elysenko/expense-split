import { redirect } from 'next/navigation';
import OnboardingForms from '@/components/OnboardingForms';
import { getCurrentUser } from '@/lib/session';

export const metadata = { title: 'Get started — SplitMate' };
export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const ctx = await getCurrentUser();
  if (!ctx) redirect('/login');
  // Already in a household → straight to the dashboard.
  if (ctx.household) redirect('/dashboard');

  return (
    <div data-testid="onboarding-main">
      <div className="page-head">
        <div>
          <h1>Get started</h1>
          <p className="page-sub">Create a household or join an existing one</p>
        </div>
      </div>
      <OnboardingForms />
    </div>
  );
}
