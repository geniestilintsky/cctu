import Link from 'next/link';
import { Upload } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { formatDate } from '@/lib/utils';
import { MATERIAL_TYPE_LABELS, UPLOAD_VERIFIED_POINTS } from '@/lib/config';
import {
  PageHeader,
  EmptyState,
  StatusBadge,
  Stat,
  Callout,
} from '@/components/ui/primitives';

export const metadata = { title: 'My uploads' };
export const dynamic = 'force-dynamic';

export default async function UploadsPage() {
  const user = await requireRole('STUDENT', 'SUPER_ADMIN');

  const uploads = await prisma.material.findMany({
    where: { uploadedById: user.id },
    orderBy: { createdAt: 'desc' },
    include: { course: { select: { code: true, title: true } } },
  });

  const approved = uploads.filter((u) => u.status === 'APPROVED');
  const pending = uploads.filter((u) => u.status === 'PENDING');
  const totalDownloads = uploads.reduce((n, u) => n + u.downloadCount, 0);

  return (
    <div>
      <PageHeader
        title="My uploads"
        description="What you have shared with the rest of the campus."
        action={
          <Link href="/upload" className="btn-primary">
            <Upload className="h-4 w-4" />
            Upload material
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Total uploads" value={uploads.length} accent="brand" />
        <Stat label="Published" value={approved.length} accent="emerald" />
        <Stat label="In review" value={pending.length} accent="gold" />
        <Stat label="Downloads earned" value={totalDownloads} accent="ink" />
      </div>

      {pending.length > 0 && (
        <div className="mb-6">
          <Callout tone="info" title={`${pending.length} upload(s) in review`}>
            An administrator checks each student upload before it goes live. You
            earn {UPLOAD_VERIFIED_POINTS} points for every approved upload.
          </Callout>
        </div>
      )}

      {uploads.length === 0 ? (
        <EmptyState
          title="You have not uploaded anything yet"
          description="Past papers, handouts and tutorials all help — and verified uploads earn points."
          action={
            <Link href="/upload" className="btn-primary">
              Upload your first material
            </Link>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Type</th>
                <th>Submitted</th>
                <th>Downloads</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((m) => (
                <tr key={m.id}>
                  <td className="max-w-[300px]">
                    <Link
                      href={`/material/${m.id}`}
                      className="line-clamp-1 font-medium text-ink-900 hover:text-brand-700"
                    >
                      {m.title}
                    </Link>
                    <span className="font-mono text-xs text-ink-500">
                      {m.course.code}
                    </span>
                    {m.status === 'REJECTED' && m.rejectionReason && (
                      <p className="mt-1 text-xs text-red-600">
                        Reason: {m.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-xs">
                    {MATERIAL_TYPE_LABELS[m.type]}
                  </td>
                  <td className="whitespace-nowrap text-xs">{formatDate(m.createdAt)}</td>
                  <td>{m.downloadCount}</td>
                  <td>
                    <StatusBadge status={m.status} />
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
