import { prisma } from '@/lib/prisma';
import { requireRole, lecturerScopeId, scopedCourseIds } from '@/lib/session';
import { ROLE_LABELS } from '@/lib/config';
import DashNav, { NavItem } from '@/components/dash/dash-nav';

export const dynamic = 'force-dynamic';

export default async function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole('LECTURER', 'TA', 'SUPER_ADMIN');
  const courseIds = await scopedCourseIds(user);

  const [pendingBoosts, unseenActivity] = await Promise.all([
    prisma.boostRequest.count({
      where: { status: 'PENDING', courseId: { in: courseIds } },
    }),
    prisma.tAActivityLog.count({
      where: { lecturerId: lecturerScopeId(user), seen: false },
    }),
  ]);

  const items: NavItem[] = [
    {
      href: '/lecturer/dashboard',
      label: 'Overview',
      badge: unseenActivity,
      icon: 'overview',
    },
    { href: '/lecturer/materials', label: 'My materials', icon: 'library' },
    { href: '/lecturer/announcements', label: 'Announcements', icon: 'announcements' },
    {
      href: '/lecturer/boost-requests',
      label: 'Boost requests',
      badge: pendingBoosts,
      icon: 'boosts',
    },
    { href: '/lecturer/points', label: 'Award points', icon: 'points' },
    { href: '/lecturer/team', label: 'Teaching assistants', icon: 'users' },
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
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
