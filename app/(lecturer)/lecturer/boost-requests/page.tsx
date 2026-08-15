import { CheckCheck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireRole, scopedCourseIds } from '@/lib/session';
import { pointsBalance } from '@/lib/points';
import { plain, formatDateTime } from '@/lib/utils';
import { PageHeader, EmptyState, Callout, StatusBadge } from '@/components/ui/primitives';
import BoostDecision, { BoostItem } from '@/components/lecturer/boost-decision';

export const metadata = { title: 'Boost requests' };
export const dynamic = 'force-dynamic';

export default async function BoostRequestsPage() {
  const user = await requireRole('LECTURER', 'TA', 'SUPER_ADMIN');
  const courseIds = await scopedCourseIds(user);

  const [pending, decided] = await Promise.all([
    prisma.boostRequest.findMany({
      where: { status: 'PENDING', courseId: { in: courseIds } },
      orderBy: { createdAt: 'asc' },
      include: {
        student: { select: { id: true, name: true, email: true, indexNumber: true } },
        course: { select: { code: true, title: true } },
      },
    }),
    prisma.boostRequest.findMany({
      where: { status: { not: 'PENDING' }, courseId: { in: courseIds } },
      orderBy: { decidedAt: 'desc' },
      take: 20,
      include: {
        student: { select: { name: true, indexNumber: true } },
        course: { select: { code: true } },
        decidedBy: { select: { name: true } },
      },
    }),
  ]);

  const balances = await Promise.all(
    pending.map((r) => pointsBalance(r.studentId))
  );

  const items: BoostItem[] = pending.map((r, i) => ({
    ...(plain(r) as unknown as Omit<BoostItem, 'balance'>),
    balance: balances[i],
  }));

  return (
    <div>
      <PageHeader
        title="Grade boost requests"
        description="Students ask you to consider points they have earned. Every request is decided by you individually."
      />

      <div className="mb-6">
        <Callout tone="warn" title="Academic policy">
          StudyHub records requests and decisions only — it never changes a grade.
          Confirm the maximum permitted boost (the plan recommends capping it at
          2–3%) with the academic board before using this in a live semester.
        </Callout>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<CheckCheck className="h-10 w-10" />}
          title="No requests waiting"
          description="New requests from students on your courses will appear here."
        />
      ) : (
        <div className="space-y-4">
          {items.map((r) => (
            <BoostDecision key={r.id} request={r} />
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
            Decision history
          </h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Points</th>
                  <th>Decision</th>
                  <th>Decided by</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <p className="font-medium text-ink-900">{r.student.name}</p>
                      <p className="font-mono text-xs text-ink-500">
                        {r.student.indexNumber || '—'}
                      </p>
                    </td>
                    <td className="font-mono text-xs">{r.course.code}</td>
                    <td>{r.pointsUsed}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="text-xs">{r.decidedBy?.name ?? '—'}</td>
                    <td className="whitespace-nowrap text-xs">
                      {formatDateTime(r.decidedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
