import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  CalendarDays,
  Download,
  FileType2,
  GraduationCap,
  User2,
  Layers,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { checkMaterialAccess } from '@/lib/access';
import { formatBytes, formatDate, plain, downloadPath } from '@/lib/utils';
import { MATERIAL_TYPE_LABELS } from '@/lib/config';
import {
  Breadcrumbs,
  PriceBadge,
  TypeBadge,
} from '@/components/ui/primitives';
import DownloadPanel from '@/components/material/download-panel';
import AffiliateCard from '@/components/material/affiliate-card';
import ReportForm from '@/components/material/report-form';
import MaterialCard from '@/components/material/material-card';

export const dynamic = 'force-dynamic';

async function getMaterial(id: string) {
  return prisma.material.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { id: true, name: true, role: true } },
      course: {
        include: {
          department: { include: { faculty: true } },
          lecturer: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const material = await getMaterial((await params).id);
  if (!material) return { title: 'Material not found' };
  return {
    title: `${material.title} — ${material.course.code}`,
    description: `${MATERIAL_TYPE_LABELS[material.type]} for ${material.course.code} ${material.course.title}${
      material.academicYear ? `, ${material.academicYear}` : ''
    }.`,
  };
}

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const material = await getMaterial((await params).id);
  if (!material) notFound();

  const user = await getSessionUser();

  const visible =
    material.status === 'APPROVED' ||
    (user &&
      (user.role === 'SUPER_ADMIN' ||
        user.role === 'LECTURER' ||
        user.role === 'TA' ||
        user.id === material.uploadedById));
  if (!visible) notFound();

  const access = await checkMaterialAccess(material, user);

  const [postDownloadOffers, inlineOffers, related] = await Promise.all([
    prisma.affiliateLink.findMany({
      where: { active: true, placement: 'post-download' },
      take: 2,
      select: { id: true, label: true, description: true, targetUrl: true },
    }),
    prisma.affiliateLink.findMany({
      where: { active: true, placement: 'material-page' },
      take: 1,
      select: { id: true, label: true, description: true, targetUrl: true },
    }),
    prisma.material.findMany({
      where: {
        status: 'APPROVED',
        courseId: material.courseId,
        id: { not: material.id },
      },
      take: 3,
      orderBy: { downloadCount: 'desc' },
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
          select: { code: true, title: true, department: { select: { name: true } } },
        },
      },
    }),
  ]);

  const facts = [
    {
      icon: FileType2,
      label: 'Type',
      value: MATERIAL_TYPE_LABELS[material.type] ?? material.type,
    },
    {
      icon: User2,
      label: 'Lecturer',
      value: material.lecturerName || material.course.lecturer?.name || '—',
    },
    { icon: CalendarDays, label: 'Academic year', value: material.academicYear || '—' },
    { icon: Layers, label: 'Semester', value: material.semester || '—' },
    { icon: GraduationCap, label: 'Level', value: `Level ${material.course.level}` },
    { icon: Download, label: 'Downloads', value: material.downloadCount.toLocaleString() },
  ];

  return (
    <div className="container-page py-10">
      <Breadcrumbs
        items={[
          { label: 'Browse', href: '/browse' },
          {
            label: material.course.department.faculty.name,
            href: `/browse?faculty=${material.course.department.facultyId}`,
          },
          {
            label: material.course.department.name,
            href: `/browse?faculty=${material.course.department.facultyId}&department=${material.course.departmentId}`,
          },
          { label: material.course.code },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <article>
          {material.status !== 'APPROVED' && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This material is <strong>{material.status.toLowerCase()}</strong> and is
              not visible to students yet.
              {material.rejectionReason && (
                <span className="mt-1 block">Reason: {material.rejectionReason}</span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={material.type} />
            <PriceBadge isFree={material.isFree} price={material.price?.toString()} />
            <Link
              href={`/browse?course=${material.courseId}`}
              className="badge-neutral font-mono hover:bg-ink-200"
            >
              {material.course.code}
            </Link>
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-ink-900 text-balance">
            {material.title}
          </h1>
          <p className="mt-3 text-[15px] text-ink-500">
            {material.course.title} · {material.course.department.name}
          </p>

          {material.description && (
            <p className="mt-6 max-w-2xl text-[17px] leading-[1.7] text-ink-700">
              {material.description}
            </p>
          )}

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-ink-100 pt-7 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-500">
                  <f.icon className="h-3.5 w-3.5" />
                  {f.label}
                </dt>
                <dd className="mt-1 truncate text-sm font-medium text-ink-900">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 text-xs text-ink-500">
            Uploaded by{' '}
            <span className="font-medium text-ink-700">{material.uploadedBy.name}</span>{' '}
            {material.autoPublished
              ? '(lecturer upload — published automatically)'
              : '(student upload — verified by the platform administrator)'}{' '}
            on {formatDate(material.createdAt)} · {formatBytes(material.fileSize)}
          </p>

          <div className="mt-4">
            <ReportForm materialId={material.id} />
          </div>

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">
                More for {material.course.code}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {related.map((m) => (
                  <MaterialCard key={m.id} material={plain(m)} />
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card relative overflow-hidden p-6">
            <span
              aria-hidden
              className={`pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full blur-2xl ${
                material.isFree ? 'bg-emerald-50' : 'bg-gold-100/70'
              }`}
            />
            <p className="tabular relative font-display text-[30px] font-semibold leading-none tracking-[-0.025em] text-ink-900">
              {material.isFree ? 'Free' : `GHS ${Number(material.price).toFixed(2)}`}
            </p>
            <p className="relative mb-5 mt-2 text-xs leading-relaxed text-ink-500">
              {material.isFree
                ? 'No account needed — download straight away.'
                : 'One-time unlock, or included in the Semester Pass.'}
            </p>

            <div className="relative">
              <DownloadPanel
                materialId={material.id}
                fileUrl={downloadPath(material.fileKey)}
                isFree={material.isFree}
                price={material.price?.toString() ?? null}
                access={access.reason}
                offers={plain(postDownloadOffers)}
              />
            </div>
          </div>

          {inlineOffers.length > 0 && (
            <div className="mt-4">
              <AffiliateCard offer={plain(inlineOffers[0])} tone="inline" />
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-ink-200/80 bg-ink-50/70 p-5 text-xs leading-relaxed text-ink-600">
            <p className="font-semibold text-ink-800">Course</p>
            <p className="mt-1">
              {material.course.code} — {material.course.title}
            </p>
            <p className="mt-2">
              {material.course.department.name},{' '}
              {material.course.department.faculty.name}
            </p>
            <Link
              href={`/browse?course=${material.courseId}`}
              className="mt-3 inline-block font-semibold text-brand-700 hover:underline"
            >
              All materials for this course →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
