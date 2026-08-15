import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { getSessionUser } from '@/lib/session';
import { ROLE_HOME, ROLE_LABELS } from '@/lib/config';

export const metadata = { title: 'Access denied' };

export default async function DeniedPage() {
  const user = await getSessionUser();
  const home = user ? ROLE_HOME[user.role] : '/';

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="card max-w-md p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-gold-500" />
        <h1 className="mt-4 font-display text-2xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-ink-500">
          {user
            ? `You are signed in as ${ROLE_LABELS[user.role]}. That area belongs to a different role.`
            : 'You need to sign in to view that page.'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href={home} className="btn-primary">
            {user ? 'Go to my dashboard' : 'Go home'}
          </Link>
          <Link href="/browse" className="btn-outline">
            Browse materials
          </Link>
        </div>
      </div>
    </div>
  );
}
