import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { deleteMaterial } from '@/app/actions/admin-actions';
import { formatDate } from '@/lib/utils';
import { MATERIAL_TYPE_LABELS } from '@/lib/config';
import { PageHeader, StatusBadge } from '@/components/ui/primitives';
import PriceEditor from '@/components/admin/price-editor';
import ConfirmButton from '@/components/ui/confirm-button';

export const metadata = { title: 'All materials' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 40;

export default async function AdminMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1));
  const status = params.status;
  const q = (params.q || '').trim();

  const where = {
    ...(status && status !== 'ALL'
      ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' }
      : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { course: { is: { code: { contains: q } } } },
          ],
        }
      : {}),
  };

  const [materials, total] = await Promise.all([
    prisma.material.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        course: { select: { code: true } },
        uploadedBy: { select: { name: true, role: true } },
        _count: { select: { purchases: true } },
      },
    }),
    prisma.material.count({ where }),
  ]);

  const tabs = ['ALL', 'APPROVED', 'PENDING', 'REJECTED'];

  return (
    <div>
      <PageHeader
        title="All materials"
        description="Override pricing, unpublish or delete anything in the catalogue."
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/admin/materials?status=${t}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={`btn-sm rounded-lg border px-3 py-1.5 text-xs font-medium ${
              (status || 'ALL') === t
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
            }`}
          >
            {t.toLowerCase()}
          </Link>
        ))}
        <form className="ml-auto flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search title or course code"
            className="input w-64 py-1.5 text-sm"
          />
          <button className="btn-outline btn-sm">Search</button>
        </form>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Type</th>
              <th>Uploader</th>
              <th>Price</th>
              <th>Sales</th>
              <th>Downloads</th>
              <th>Status</th>
              <th>Added</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id}>
                <td className="max-w-[280px]">
                  <Link
                    href={`/material/${m.id}`}
                    className="line-clamp-1 font-medium text-ink-900 hover:text-brand-700"
                  >
                    {m.title}
                  </Link>
                  <p className="font-mono text-xs text-ink-500">{m.course.code}</p>
                </td>
                <td className="whitespace-nowrap text-xs">
                  {MATERIAL_TYPE_LABELS[m.type]}
                </td>
                <td className="whitespace-nowrap text-xs">
                  {m.uploadedBy.name}
                  <span className="block text-ink-400">
                    {m.uploadedBy.role.toLowerCase()}
                  </span>
                </td>
                <td>
                  <PriceEditor
                    materialId={m.id}
                    isFree={m.isFree}
                    price={m.price?.toString() ?? null}
                  />
                </td>
                <td>{m._count.purchases}</td>
                <td>{m.downloadCount}</td>
                <td>
                  <StatusBadge status={m.status} />
                </td>
                <td className="whitespace-nowrap text-xs">{formatDate(m.createdAt)}</td>
                <td>
                  <form action={deleteMaterial} className="flex justify-end">
                    <input type="hidden" name="materialId" value={m.id} />
                    <ConfirmButton
                      className="btn-ghost btn-sm text-ink-400 hover:text-red-600"
                      message={`Permanently delete “${m.title}” and its file?`}
                    >
                      Delete
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sm text-ink-400">
                  Nothing matches that filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <Link
            href={`/admin/materials?page=${Math.max(1, page - 1)}`}
            className="btn-outline btn-sm"
          >
            Previous
          </Link>
          <span className="text-ink-500">
            Page {page} of {Math.ceil(total / PAGE_SIZE)}
          </span>
          <Link
            href={`/admin/materials?page=${page + 1}`}
            className="btn-outline btn-sm"
          >
            Next
          </Link>
        </div>
      )}
    </div>
  );
}
