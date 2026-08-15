import { Bell, BellOff } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { toggleSubscription } from '@/app/actions/student-actions';
import { PageHeader, Callout } from '@/components/ui/primitives';
import ProfileForm from '@/components/student/profile-form';

export const metadata = { title: 'Alerts & profile' };
export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await requireRole('STUDENT', 'SUPER_ADMIN');

  const [faculties, lecturers, subs] = await Promise.all([
    prisma.faculty.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        departments: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            courses: {
              orderBy: { code: 'asc' },
              select: { id: true, code: true, title: true },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: 'LECTURER', active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, _count: { select: { coursesLed: true } } },
    }),
    prisma.notificationSubscription.findMany({ where: { studentId: user.id } }),
  ]);

  const courseOn = (courseId: string) =>
    subs.some((s) => s.courseId === courseId && s.active);
  const lecturerOn = (lecturerId: string) =>
    subs.some((s) => s.lecturerId === lecturerId && s.active);

  const canReceive = Boolean(user.email || user.phone);
  const activeCount = subs.filter((s) => s.active).length;

  return (
    <div>
      <PageHeader
        title="Alerts & profile"
        description="Follow a course or a lecturer to get their announcements. Change any of this whenever you like."
      />

      {!canReceive && (
        <div className="mb-6">
          <Callout tone="danger" title="No contact details on file">
            Add an email or phone number below before subscribing, otherwise we
            have no way to reach you.
          </Callout>
        </div>
      )}

      <div className="mb-8">
        <ProfileForm
          name={user.name}
          email={user.email}
          phone={user.phone}
          indexNumber={user.indexNumber}
        />
      </div>

      <p className="mb-4 text-sm text-ink-500">
        <span className="font-semibold text-ink-900">{activeCount}</span> active
        subscription{activeCount === 1 ? '' : 's'}. Emails go out now; WhatsApp is
        added in Phase 2 using the same list.
      </p>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
          Follow a lecturer
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {lecturers.map((l) => {
            const on = lecturerOn(l.id);
            return (
              <form
                key={l.id}
                action={toggleSubscription}
                className="card flex items-center justify-between gap-3 p-3"
              >
                <input type="hidden" name="lecturerId" value={l.id} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-900">
                    {l.name}
                  </span>
                  <span className="text-xs text-ink-500">
                    {l._count.coursesLed} course{l._count.coursesLed === 1 ? '' : 's'}
                  </span>
                </span>
                <button
                  className={on ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                  disabled={!canReceive && !on}
                >
                  {on ? (
                    <>
                      <Bell className="h-3.5 w-3.5" /> Following
                    </>
                  ) : (
                    <>
                      <BellOff className="h-3.5 w-3.5" /> Follow
                    </>
                  )}
                </button>
              </form>
            );
          })}
          {lecturers.length === 0 && (
            <p className="text-sm text-ink-500">No lecturer accounts yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
          Follow a course
        </h2>
        <div className="space-y-4">
          {faculties.map((f) => (
            <details key={f.id} className="card overflow-hidden" open={false}>
              <summary className="cursor-pointer bg-ink-50 px-4 py-3 text-sm font-medium text-ink-900">
                {f.name}
              </summary>
              <div className="divide-y divide-ink-100">
                {f.departments.map((d) => (
                  <div key={d.id} className="px-4 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                      {d.name}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {d.courses.map((c) => {
                        const on = courseOn(c.id);
                        return (
                          <form
                            key={c.id}
                            action={toggleSubscription}
                            className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 px-3 py-2"
                          >
                            <input type="hidden" name="courseId" value={c.id} />
                            <span className="min-w-0">
                              <span className="font-mono text-xs text-ink-500">
                                {c.code}
                              </span>
                              <span className="block truncate text-sm text-ink-800">
                                {c.title}
                              </span>
                            </span>
                            <button
                              className={on ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                              disabled={!canReceive && !on}
                            >
                              {on ? 'On' : 'Off'}
                            </button>
                          </form>
                        );
                      })}
                      {d.courses.length === 0 && (
                        <p className="text-xs text-ink-400">No courses.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
