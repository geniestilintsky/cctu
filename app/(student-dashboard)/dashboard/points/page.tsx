import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { pointsBalance, spendablePoints, pointsPendingInRequests } from '@/lib/points';
import { cancelBoostRequest } from '@/app/actions/student-actions';
import { formatDate, formatDateTime } from '@/lib/utils';
import { UPLOAD_VERIFIED_POINTS } from '@/lib/config';
import {
  PageHeader,
  Stat,
  EmptyState,
  StatusBadge,
  Callout,
} from '@/components/ui/primitives';
import BoostRequestForm from '@/components/student/boost-request-form';
import ConfirmButton from '@/components/ui/confirm-button';

export const metadata = { title: 'Points & boosts' };
export const dynamic = 'force-dynamic';

const SOURCE_LABEL: Record<string, string> = {
  UPLOAD_VERIFIED: 'Upload verified',
  PURCHASE_AWARDED: 'Awarded after purchase',
  BOOST_REDEEMED: 'Boost approved',
};

export default async function PointsPage() {
  const user = await requireRole('STUDENT', 'SUPER_ADMIN');

  const [ledger, requests, balance, spendable, committed, courses] = await Promise.all([
    prisma.pointTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { code: true } },
        awardedBy: { select: { name: true } },
      },
    }),
    prisma.boostRequest.findMany({
      where: { studentId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { code: true, title: true } },
        decidedBy: { select: { name: true } },
      },
    }),
    pointsBalance(user.id),
    spendablePoints(user.id),
    pointsPendingInRequests(user.id),
    prisma.course.findMany({
      where: { points: { some: { userId: user.id } } },
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        title: true,
        lecturer: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Points & grade boosts"
        description="Earn points by uploading verified materials, or when a lecturer awards them after a purchase."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Balance" value={balance} accent="gold" />
        <Stat label="Available to commit" value={spendable} accent="brand" />
        <Stat label="Committed to requests" value={committed} accent="ink" />
      </div>

      <div className="mb-8">
        <Callout tone="warn" title="How boosts actually work">
          StudyHub records your request and your lecturer&apos;s decision. It never
          changes a grade by itself — any adjustment is made by your lecturer
          under the university&apos;s academic policy, within whatever cap the
          academic board has approved.
        </Callout>
      </div>

      <div className="mb-10">
        {courses.length === 0 ? (
          <EmptyState
            title="No points yet"
            description={`Upload a material — each verified upload earns ${UPLOAD_VERIFIED_POINTS} points.`}
          />
        ) : (
          <BoostRequestForm
            courses={courses.map((c) => ({
              id: c.id,
              code: c.code,
              title: c.title,
              lecturer: c.lecturer?.name ?? null,
            }))}
            available={spendable}
            indexNumber={user.indexNumber}
          />
        )}
      </div>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
          My requests
        </h2>
        {requests.length === 0 ? (
          <div className="card p-5 text-sm text-ink-500">
            You have not made any requests yet.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Points</th>
                  <th>Requested</th>
                  <th>Decision</th>
                  <th>Status</th>
                  <th className="text-right"></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="font-mono text-xs text-ink-500">
                        {r.course.code}
                      </span>
                      <p className="text-sm">{r.course.title}</p>
                    </td>
                    <td>{r.pointsUsed}</td>
                    <td className="whitespace-nowrap text-xs">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="max-w-[240px] text-xs">
                      {r.decidedAt ? (
                        <>
                          <span className="block text-ink-700">
                            {r.decidedBy?.name} · {formatDateTime(r.decidedAt)}
                          </span>
                          {r.decisionNote && (
                            <span className="mt-0.5 block text-ink-500">
                              “{r.decisionNote}”
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-ink-400">awaiting lecturer</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="text-right">
                      {r.status === 'PENDING' && (
                        <form action={cancelBoostRequest} className="flex justify-end">
                          <input type="hidden" name="requestId" value={r.id} />
                          <ConfirmButton
                            className="btn-ghost btn-sm"
                            message="Withdraw this request?"
                          >
                            Withdraw
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
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
          Points ledger
        </h2>
        {ledger.length === 0 ? (
          <div className="card p-5 text-sm text-ink-500">Nothing recorded yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Course</th>
                  <th>Detail</th>
                  <th className="text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap text-xs">{formatDate(t.createdAt)}</td>
                    <td className="text-xs">{SOURCE_LABEL[t.source] ?? t.source}</td>
                    <td className="font-mono text-xs">{t.course?.code ?? '—'}</td>
                    <td className="max-w-[260px] text-xs text-ink-500">
                      <span className="line-clamp-1">{t.note}</span>
                      {t.awardedBy && (
                        <span className="block text-ink-400">by {t.awardedBy.name}</span>
                      )}
                    </td>
                    <td
                      className={`text-right font-medium ${
                        t.points < 0 ? 'text-ink-400' : 'text-emerald-700'
                      }`}
                    >
                      {t.points > 0 ? `+${t.points}` : t.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
