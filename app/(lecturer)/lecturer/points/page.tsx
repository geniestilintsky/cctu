import { prisma } from '@/lib/prisma';
import { requireRole, scopedCourseIds } from '@/lib/session';
import { formatDate, formatMoney } from '@/lib/utils';
import { PageHeader, EmptyState, Callout, Stat } from '@/components/ui/primitives';
import AwardPointsForm from '@/components/lecturer/award-points-form';

export const metadata = { title: 'Award points' };
export const dynamic = 'force-dynamic';

export default async function AwardPointsPage() {
  const user = await requireRole('LECTURER', 'TA', 'SUPER_ADMIN');
  const courseIds = await scopedCourseIds(user);

  const [purchases, awarded, uploadsAwarded] = await Promise.all([
    prisma.purchase.findMany({
      where: { material: { courseId: { in: courseIds } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true, indexNumber: true } },
        material: {
          select: { id: true, title: true, course: { select: { code: true } } },
        },
      },
    }),
    prisma.pointTransaction.findMany({
      where: { source: 'PURCHASE_AWARDED', courseId: { in: courseIds } },
      select: { userId: true, materialId: true, points: true },
    }),
    prisma.pointTransaction.aggregate({
      where: { source: 'UPLOAD_VERIFIED', courseId: { in: courseIds } },
      _sum: { points: true },
    }),
  ]);

  const awardedFor = (userId: string, materialId: string) =>
    awarded.find((a) => a.userId === userId && a.materialId === materialId)?.points ??
    null;

  const totalAwarded = awarded.reduce((n, a) => n + a.points, 0);

  return (
    <div>
      <PageHeader
        title="Award purchase points"
        description="When a student buys a paid material for one of your courses, you may optionally award points for that transaction."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Purchases on my courses" value={purchases.length} accent="brand" />
        <Stat label="Points I have awarded" value={totalAwarded} accent="gold" />
        <Stat
          label="Upload points (automatic)"
          value={uploadsAwarded._sum.points ?? 0}
          sub="awarded by the admin on approval"
          accent="emerald"
        />
      </div>

      <div className="mb-6">
        <Callout tone="info">
          Awarding points is entirely optional and never automatic. Students can
          later ask you to consider these points — you approve or reject each
          request individually on the boost requests page.
        </Callout>
      </div>

      {purchases.length === 0 ? (
        <EmptyState
          title="No purchases yet"
          description="Once students buy paid materials for your courses, they appear here."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Index no.</th>
                <th>Material</th>
                <th>Amount</th>
                <th>Date</th>
                <th className="text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td>
                    <p className="font-medium text-ink-900">{p.user.name}</p>
                    <p className="text-xs text-ink-500">{p.user.email}</p>
                  </td>
                  <td className="font-mono text-xs">{p.user.indexNumber || '—'}</td>
                  <td className="max-w-[240px]">
                    <span className="line-clamp-1">{p.material.title}</span>
                    <span className="font-mono text-xs text-ink-500">
                      {p.material.course.code}
                    </span>
                  </td>
                  <td>{formatMoney(p.amount.toString())}</td>
                  <td className="whitespace-nowrap text-xs">{formatDate(p.createdAt)}</td>
                  <td className="text-right">
                    <AwardPointsForm
                      purchaseId={p.id}
                      defaultIndexNumber={p.user.indexNumber}
                      awarded={awardedFor(p.userId, p.materialId)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
