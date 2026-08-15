import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuthShell from '../auth-shell';
import SignUpForm from './sign-up-form';
import { getSessionUser } from '@/lib/session';
import { ROLE_HOME } from '@/lib/config';

export const metadata = { title: 'Create account' };

export default async function SignUpPage() {
  const user = await getSessionUser();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <AuthShell
      title="Create your student account"
      subtitle="Free materials never need an account — sign up to buy, upload and earn points."
      footer={
        <>
          Already registered?{' '}
          <Link
            href="/auth/sign-in"
            className="font-semibold text-brand-700 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
