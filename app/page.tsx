import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

// `/` routes by session state: no session → /login, session without a household
// → /onboarding, otherwise → /dashboard.
export default async function Home() {
  const ctx = await getCurrentUser();
  if (!ctx) redirect('/login');
  if (!ctx.household) redirect('/onboarding');
  redirect('/dashboard');
}
