import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import DashNav, { NavItem } from '@/components/dash/dash-nav';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole('SUPER_ADMIN');

  const [pending, openReports] = await Promise.all([
    prisma.material.count({ where: { status: 'PENDING' } }),
    prisma.materialReport.count({ where: { status: 'PENDING' } }),
  ]);

  const items: NavItem[] = [
    { href: '/admin/review-queue', label: 'Review queue', badge: pending, icon: 'queue' },
    { href: '/admin/materials', label: 'All materials', icon: 'library' },
    { href: '/admin/users', label: 'Users & lecturers', icon: 'users' },
    { href: '/admin/taxonomy', label: 'Faculties & courses', icon: 'taxonomy' },
    { href: '/admin/revenue', label: 'Revenue', icon: 'revenue' },
    { href: '/admin/affiliate-links', label: 'Affiliate links', icon: 'affiliate' },
    {
      href: '/admin/reports',
      label: 'Content reports',
      badge: openReports,
      icon: 'reports',
    },
  ];

  return (
    <div className="flex min-h-screen bg-ink-50/60">
      <DashNav items={items} roleLabel="Super Admin" userName={user.name} />
      <div className="relative min-w-0 flex-1">
        {/* A soft wash at the top of the canvas keeps the content area from
            reading as a flat grey box. */}
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
