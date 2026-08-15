import { prisma } from '@/lib/prisma';
import { requireRole, lecturerScopeId } from '@/lib/session';
import { formatDateTime } from '@/lib/utils';
import { PageHeader, EmptyState, Callout } from '@/components/ui/primitives';
import AnnouncementForm, { CourseChoice } from '@/components/lecturer/announcement-form';

export const metadata = { title: 'Announcements' };
export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage() {
  const user = await requireRole('LECTURER', 'TA', 'SUPER_ADMIN');
  const ownerId = lecturerScopeId(user);

  const courses = await prisma.course.findMany({
    where: { lecturerId: ownerId },
    orderBy: { code: 'asc' },
    select: {
      id: true,
      code: true,
      title: true,
      _count: { select: { notifSubs: true } },
    },
  });

  const posted = await prisma.announcement.findMany({
    where: { courseId: { in: courses.map((c) => c.id) } },
    orderBy: { createdAt: 'desc' },
    take: 25,
    include: {
      course: { select: { code: true, title: true } },
      author: { select: { name: true, role: true } },
    },
  });

  const choices: CourseChoice[] = courses.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    subscribers: c._count.notifSubs,
  }));

  return (
    <div>
      <PageHeader
        title="Course announcements"
        description="Reaches every student subscribed to the course — and anyone subscribed to you as a lecturer."
      />

      {courses.length === 0 ? (
        <Callout tone="warn" title="No courses assigned yet">
          Ask the platform administrator to set you as the primary lecturer for
          your courses before posting announcements.
        </Callout>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <AnnouncementForm courses={choices} />

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
              Sent announcements
            </h2>
            {posted.length === 0 ? (
              <EmptyState
                title="Nothing sent yet"
                description="Your posted announcements and their delivery counts appear here."
              />
            ) : (
              <ul className="space-y-3">
                {posted.map((a) => (
                  <li key={a.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="badge-neutral font-mono">{a.course.code}</span>
                        <p className="mt-1.5 font-medium text-ink-900">{a.title}</p>
                      </div>
                      {a.sentViaEmail ? (
                        <span className="badge-free shrink-0">emailed</span>
                      ) : (
                        <span className="badge-neutral shrink-0">no subscribers</span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm text-ink-600">
                      {a.body}
                    </p>
                    <p className="mt-3 text-xs text-ink-400">
                      {formatDateTime(a.createdAt)} · {a.author.name}
                      {a.author.role === 'TA' ? ' (TA)' : ''} · {a.recipients}{' '}
                      recipient{a.recipients === 1 ? '' : 's'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
