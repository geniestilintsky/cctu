import { ShieldCheck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { plain } from '@/lib/utils';
import { PageHeader, EmptyState, Callout } from '@/components/ui/primitives';
import ReportRow, { ReportItem } from '@/components/admin/report-row';

export const metadata = { title: 'Content reports' };
export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const reports = await prisma.materialReport.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      material: {
        select: {
          id: true,
          title: true,
          status: true,
          course: { select: { code: true } },
        },
      },
      reporter: { select: { name: true, email: true } },
    },
  });

  const open = reports.filter((r) => r.status === 'PENDING');

  return (
    <div>
      <PageHeader
        title="Content reports & takedowns"
        description="Every material carries a “Report content” flag. Copyright claims on books and theses land here."
      />

      <div className="mb-6">
        <Callout tone="warn" title="Open item for the school">
          Confirm in writing who carries upload liability, and publish the takedown
          process on the policy page before launch.
        </Callout>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-10 w-10" />}
          title="No reports filed"
          description="Nothing in the catalogue has been flagged by students or rights-holders."
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-500">
            <span className="font-semibold text-ink-900">{open.length}</span> open ·{' '}
            {reports.length - open.length} closed
          </p>
          <div className="space-y-4">
            {reports.map((r) => (
              <ReportRow key={r.id} report={plain(r) as unknown as ReportItem} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
