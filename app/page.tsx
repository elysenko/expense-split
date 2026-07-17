import { redirect } from 'next/navigation';

// `/` → dashboard for the authenticated app. In the real build this checks the
// session cookie and sends unauthenticated visitors to /login.
export default function Home() {
  redirect('/dashboard');
}
