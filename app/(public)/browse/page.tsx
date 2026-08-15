import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { FileSearch } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { plain } from '@/lib/utils';
import BrowseFilters, { TaxonomyTree } from '@/components/browse/browse-filters';
import MaterialCard from '@/components/material/material-card';
import { EmptyState, PageHeader } from '@/components/ui/primitives';

export const metadata = {
  title: 'Browse materials',
  description:
    'Filter past exams, quizzes, handouts, tutorials, books and theses by faculty, department, course, year and type.',
};

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;

type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const facultyId = one(params.faculty);
  const departmentId = one(params.department);
  const courseId = one(params.course);
  const level = one(params.level);
  const type = one(params.type);
  const year = one(params.year);
  const price = one(params.price);
  const q = one(params.q).trim();
  const page = Math.max(1, Number(one(params.page) || 1));

  const where: Prisma.MaterialWhereInput = {
    status: 'APPROVED',
    ...(type ? { type: type as Prisma.EnumMaterialTypeFilter['equals'] } : {}),
    ...(year ? { academicYear: year } : {}),
    ...(price === 'free' ? { isFree: true } : {}),
    ...(price === 'paid' ? { isFree: false } : {}),
    course: {
      ...(courseId ? { id: courseId } : {}),
      ...(level ? { level: Number(level) } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(facultyId && !departmentId ? { department: { facultyId } } : {}),
    },
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { lecturerName: { contains: q } },
            { description: { contains: q } },
            { course: { is: { code: { contains: q } } } },
            { course: { is: { title: { contains: q } } } },
          ],
        }
      : {}),
  };

  const [tree, total, materials] = await Promise.all([
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
              select: { id: true, code: true, title: true, level: true },
            },
          },
        },
      },
    }),
    prisma.material.count({ where }),
    prisma.material.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        type: true,
        isFree: true,
        price: true,
        academicYear: true,
        semester: true,
        lecturerName: true,
        downloadCount: true,
        course: {
          select: {
            code: true,
            title: true,
            department: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const next = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
        const val = one(v);
        if (val) acc[k] = val;
        return acc;
      }, {})
    );
    next.set('page', String(p));
    return `/browse?${next.toString()}`;
  };

  return (
    <div className="container-page py-10">
      <PageHeader
        title="Browse materials"
        description="Faculty → department → course → year → type. Free materials download straight away, no account needed."
      />

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <BrowseFilters tree={plain(tree) as TaxonomyTree} />
          </div>
        </aside>

        <section>
          <div className="mb-5 flex items-baseline justify-between border-b border-ink-100 pb-4">
            <p className="text-sm text-ink-500">
              <span className="tabular font-semibold text-ink-900">{total}</span>{' '}
              material{total === 1 ? '' : 's'}
              {q && (
                <>
                  {' '}
                  matching <span className="font-medium text-ink-700">“{q}”</span>
                </>
              )}
            </p>
            {pages > 1 && (
              <p className="text-xs text-ink-400">
                Page {page} of {pages}
              </p>
            )}
          </div>

          {materials.length === 0 ? (
            <EmptyState
              icon={<FileSearch className="h-10 w-10" />}
              title="Nothing matches those filters yet"
              description="Try widening the filters — or be the first to upload for this course."
              action={
                <Link href="/upload" className="btn-primary">
                  Upload a material
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {materials.map((m, i) => (
                <MaterialCard key={m.id} material={plain(m)} index={i} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2">
              <Link
                href={qs(Math.max(1, page - 1))}
                aria-disabled={page === 1}
                className={`btn-outline btn-sm ${page === 1 ? 'pointer-events-none opacity-40' : ''}`}
              >
                Previous
              </Link>
              <span className="px-2 text-sm text-ink-500">
                {page} / {pages}
              </span>
              <Link
                href={qs(Math.min(pages, page + 1))}
                aria-disabled={page === pages}
                className={`btn-outline btn-sm ${page === pages ? 'pointer-events-none opacity-40' : ''}`}
              >
                Next
              </Link>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
