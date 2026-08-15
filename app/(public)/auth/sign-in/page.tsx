import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import AuthShell from '../auth-shell';
import SignInForm from './sign-in-form';
import { getSessionUser } from '@/lib/session';
import { ROLE_HOME } from '@/lib/config';

export const metadata = { title: 'Sign in' };

export default async function SignInPage() {
  const user = await getSessionUser();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to download paid materials, upload your own and track your points."
      footer={
        <>
          New here?{' '}
          <Link
            href="/auth/sign-up"
            className="font-semibold text-brand-700 hover:underline"
          >
            Create a student account
          </Link>
          . Lecturer accounts are created by the platform administrator.
        </>
      }
    >
      <Suspense fallback={<div className="h-56 animate-pulse rounded-lg bg-ink-100" />}>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
