import OnboardingForms from '@/components/OnboardingForms';

export const metadata = { title: 'Get started — SplitMate' };

export default function OnboardingPage() {
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
