import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { ROLE_LABELS } from '@/lib/config';
import DashNav, { NavItem } from '@/components/dash/dash-nav';

export const dynamic = 'force-dynamic';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole('STUDENT', 'SUPER_ADMIN');

  const pendingUploads = await prisma.material.count({
    where: { uploadedById: user.id, status: 'PENDING' },
  });

  const items: NavItem[] = [
    { href: '/dashboard', label: 'Overview', icon: 'overview' },
    { href: '/dashboard/purchases', label: 'My purchases', icon: 'purchases' },
    {
      href: '/dashboard/uploads',
      label: 'My uploads',
      badge: pendingUploads,
      icon: 'uploads',
    },
    { href: '/dashboard/points', label: 'Points & boosts', icon: 'boosts' },
    { href: '/dashboard/notifications', label: 'Alerts & profile', icon: 'alerts' },
  ];

  return (
    <div className="flex min-h-screen bg-ink-50/60">
      <DashNav
        items={items}
        roleLabel={ROLE_LABELS[user.role]}
        userName={user.name}
      />
      <div className="relative min-w-0 flex-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white to-transparent"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
