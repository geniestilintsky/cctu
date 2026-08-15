import { prisma } from '@/lib/prisma';
import { setUserActive } from '@/app/actions/admin-actions';
import { formatDate } from '@/lib/utils';
import { PageHeader, Stat, StatusBadge } from '@/components/ui/primitives';
import { AddLecturerForm, ResetPasswordButton } from '@/components/admin/user-forms';
import ConfirmButton from '@/components/ui/confirm-button';

export const metadata = { title: 'Users & lecturers' };
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const [lecturers, students, counts] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'LECTURER' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        active: true,
        createdAt: true,
        _count: { select: { uploads: true, coursesLed: true } },
        addedUsers: {
          where: { role: 'TA' },
          select: { id: true, name: true, email: true, active: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        indexNumber: true,
        active: true,
        createdAt: true,
        _count: { select: { uploads: true, purchases: true } },
      },
    }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
  ]);

  const countOf = (role: string) =>
    counts.find((c) => c.role === role)?._count._all ?? 0;

  return (
    <div>
      <PageHeader
        title="Users & lecturers"
        description="Lecturer accounts are created here. TAs are added by their own lecturer and are shown beneath them."
        action={<AddLecturerForm />}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Lecturers" value={countOf('LECTURER')} accent="brand" />
        <Stat label="Teaching assistants" value={countOf('TA')} accent="gold" />
        <Stat label="Students" value={countOf('STUDENT')} accent="emerald" />
        <Stat label="Admins" value={countOf('SUPER_ADMIN')} accent="ink" />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
          Lecturers
        </h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Lecturer</th>
                <th>Courses</th>
                <th>Uploads</th>
                <th>Teaching assistants</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lecturers.map((l) => (
                <tr key={l.id}>
                  <td>
                    <p className="font-medium text-ink-900">{l.name}</p>
                    <p className="text-xs text-ink-500">{l.email}</p>
                  </td>
                  <td>{l._count.coursesLed}</td>
                  <td>{l._count.uploads}</td>
                  <td>
                    {l.addedUsers.length === 0 ? (
                      <span className="text-xs text-ink-400">none</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {l.addedUsers.map((ta) => (
                          <li key={ta.id} className="text-xs">
                            {ta.name}{' '}
                            {!ta.active && (
                              <span className="text-ink-400">(disabled)</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    <span className="text-[11px] text-ink-400">
                      {l.addedUsers.length}/3 used
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={l.active ? 'ACTIVE' : 'CANCELLED'} />
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <ResetPasswordButton userId={l.id} />
                      <form action={setUserActive}>
                        <input type="hidden" name="userId" value={l.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={l.active ? 'false' : 'true'}
                        />
                        <ConfirmButton
                          className="btn-outline btn-sm"
                          message={
                            l.active
                              ? `Disable ${l.name}? They will not be able to sign in.`
                              : `Re-enable ${l.name}?`
                          }
                        >
                          {l.active ? 'Disable' : 'Enable'}
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {lecturers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-ink-400">
                    No lecturer accounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
          Students{' '}
          <span className="text-sm font-normal text-ink-400">
            (100 most recent)
          </span>
        </h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Index number</th>
                <th>Uploads</th>
                <th>Purchases</th>
                <th>Joined</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <p className="font-medium text-ink-900">{s.name}</p>
                    <p className="text-xs text-ink-500">{s.email}</p>
                  </td>
                  <td className="font-mono text-xs">{s.indexNumber || '—'}</td>
                  <td>{s._count.uploads}</td>
                  <td>{s._count.purchases}</td>
                  <td className="whitespace-nowrap text-xs">{formatDate(s.createdAt)}</td>
                  <td>
                    <StatusBadge status={s.active ? 'ACTIVE' : 'CANCELLED'} />
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <ResetPasswordButton userId={s.id} />
                      <form action={setUserActive}>
                        <input type="hidden" name="userId" value={s.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={s.active ? 'false' : 'true'}
                        />
                        <ConfirmButton
                          className="btn-outline btn-sm"
                          message={s.active ? `Disable ${s.name}?` : `Re-enable ${s.name}?`}
                        >
                          {s.active ? 'Disable' : 'Enable'}
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-ink-400">
                    No students have signed up yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
