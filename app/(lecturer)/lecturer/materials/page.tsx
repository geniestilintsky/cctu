import Link from 'next/link';
import { Upload } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireRole, lecturerScopeId, scopedCourseIds } from '@/lib/session';
import { formatDate } from '@/lib/utils';
import { MATERIAL_TYPE_LABELS } from '@/lib/config';
import {
  PageHeader,
  EmptyState,
  PriceBadge,
  StatusBadge,
} from '@/components/ui/primitives';

export const metadata = { title: 'My materials' };
export const dynamic = 'force-dynamic';

export default async function LecturerMaterialsPage() {
  const user = await requireRole('LECTURER', 'TA', 'SUPER_ADMIN');
  const ownerId = lecturerScopeId(user);
  const courseIds = await scopedCourseIds(user);

  const materials = await prisma.material.findMany({
    where: {
      OR: [
        { courseId: { in: courseIds } },
        { uploadedById: user.id },
        { uploadedById: ownerId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { code: true } },
      uploadedBy: { select: { name: true, role: true } },
      _count: { select: { purchases: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="My materials"
        description="Everything published to your courses, by you or your teaching assistants."
        action={
          <Link href="/upload" className="btn-primary">
            <Upload className="h-4 w-4" />
            Publish material
          </Link>
        }
      />

      {materials.length === 0 ? (
        <EmptyState
          title="Nothing published yet"
          description="Upload a past paper, handout or tutorial — lecturer uploads go live immediately."
          action={
            <Link href="/upload" className="btn-primary">
              Publish your first material
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
                <th>Published by</th>
                <th>Price</th>
                <th>Sales</th>
                <th>Downloads</th>
                <th>Status</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td className="max-w-[260px]">
                    <Link
                      href={`/material/${m.id}`}
                      className="line-clamp-1 font-medium text-ink-900 hover:text-brand-700"
                    >
                      {m.title}
                    </Link>
                    <span className="font-mono text-xs text-ink-500">
                      {m.course.code}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-xs">
                    {MATERIAL_TYPE_LABELS[m.type]}
                  </td>
                  <td className="whitespace-nowrap text-xs">
                    {m.uploadedBy.name}
                    {m.uploadedBy.role === 'TA' && (
                      <span className="ml-1 text-ink-400">(TA)</span>
                    )}
                  </td>
                  <td>
                    <PriceBadge isFree={m.isFree} price={m.price?.toString()} />
                  </td>
                  <td>{m._count.purchases}</td>
                  <td>{m.downloadCount}</td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="whitespace-nowrap text-xs">{formatDate(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
