import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { removeTeachingAssistant } from '@/app/actions/lecturer-actions';
import { MAX_TAS_PER_LECTURER } from '@/lib/config';
import { relativeTime, formatDate } from '@/lib/utils';
import { PageHeader, Stat, EmptyState, Callout } from '@/components/ui/primitives';
import AddTAForm from '@/components/lecturer/add-ta-form';
import ConfirmButton from '@/components/ui/confirm-button';

export const metadata = { title: 'Teaching assistants' };
export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const user = await requireRole('LECTURER', 'TA', 'SUPER_ADMIN');
  // Only the lecturer manages the team; a TA lands back on the overview.
  if (user.role === 'TA') redirect('/lecturer/dashboard');

  const [tas, activity] = await Promise.all([
    prisma.user.findMany({
      where: { addedById: user.id, role: 'TA' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        active: true,
        createdAt: true,
        _count: { select: { uploads: true, announcements: true, taActions: true } },
      },
    }),
    prisma.tAActivityLog.findMany({
      where: { lecturerId: user.id, actor: { role: 'TA' } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { actor: { select: { name: true } } },
    }),
  ]);

  const active = tas.filter((t) => t.active);

  return (
    <div>
      <PageHeader
        title="Teaching assistants"
        description={`Up to ${MAX_TAS_PER_LECTURER} TAs. They get an identical dashboard for your courses — and you see everything they do.`}
        action={<AddTAForm remaining={MAX_TAS_PER_LECTURER - active.length} />}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Active TAs"
          value={`${active.length}/${MAX_TAS_PER_LECTURER}`}
          accent="brand"
        />
        <Stat
          label="TA uploads"
          value={tas.reduce((n, t) => n + t._count.uploads, 0)}
          accent="emerald"
        />
        <Stat
          label="Logged TA actions"
          value={tas.reduce((n, t) => n + t._count.taActions, 0)}
          accent="gold"
        />
      </div>

      {tas.length === 0 ? (
        <EmptyState
          title="No teaching assistants yet"
          description="Add a TA to share uploading, announcements and point assignment for your courses."
        />
      ) : (
        <div className="table-wrap mb-8">
          <table className="table">
            <thead>
              <tr>
                <th>Assistant</th>
                <th>Uploads</th>
                <th>Announcements</th>
                <th>Added</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tas.map((ta) => (
                <tr key={ta.id}>
                  <td>
                    <p className="font-medium text-ink-900">{ta.name}</p>
                    <p className="text-xs text-ink-500">{ta.email}</p>
                  </td>
                  <td>{ta._count.uploads}</td>
                  <td>{ta._count.announcements}</td>
                  <td className="whitespace-nowrap text-xs">{formatDate(ta.createdAt)}</td>
                  <td>
                    {ta.active ? (
                      <span className="badge-free">active</span>
                    ) : (
                      <span className="badge-neutral">removed</span>
                    )}
                  </td>
                  <td className="text-right">
                    {ta.active && (
                      <form action={removeTeachingAssistant} className="flex justify-end">
                        <input type="hidden" name="taId" value={ta.id} />
                        <ConfirmButton
                          className="btn-outline btn-sm"
                          message={`Remove ${ta.name}? They lose access immediately, but their uploads and activity log stay.`}
                        >
                          Remove
                        </ConfirmButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
          TA activity log
        </h2>
        {activity.length === 0 ? (
          <Callout tone="info">
            Nothing yet. Every upload, announcement, point award and boost
            decision made by a TA is recorded here under their name.
          </Callout>
        ) : (
          <ul className="card divide-y divide-ink-100">
            {activity.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <span className="text-sm text-ink-800">{a.summary}</span>
                <span className="shrink-0 text-xs text-ink-400">
                  {relativeTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
