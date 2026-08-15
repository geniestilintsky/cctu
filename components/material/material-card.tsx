import Link from 'next/link';
import { ArrowUpRight, Download, FileText, User2 } from 'lucide-react';
import { TypeBadge, PriceBadge } from '@/components/ui/primitives';

export type MaterialCardData = {
  id: string;
  title: string;
  type: string;
  isFree: boolean;
  price: number | string | null;
  academicYear: string | null;
  semester: string | null;
  lecturerName: string | null;
  downloadCount: number;
  course: { code: string; title: string; department: { name: string } };
};

/**
 * Entrance is a CSS animation rather than a Framer one: these render in lists
 * of 20+, and CSS keyframes run off the main thread so the stagger stays smooth
 * while the page is still hydrating.
 */
export default function MaterialCard({
  material,
  index,
}: {
  material: MaterialCardData;
  index?: number;
}) {
  return (
    <Link
      href={`/material/${material.id}`}
      style={
        index === undefined
          ? undefined
          : { animationDelay: `${Math.min(index, 11) * 45}ms` }
      }
      className={`group card-interactive relative flex h-full flex-col overflow-hidden p-4 ${
        index === undefined ? '' : 'animate-fade-up'
      }`}
    >
      {/* Light catches the top edge on hover — the card reads as lifting toward
          the pointer rather than just gaining a shadow. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-brand-50/70 to-transparent opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
      />

      <div className="relative mb-3 flex items-start justify-between gap-3">
        <span className="badge-neutral font-mono tracking-tight">
          {material.course.code}
        </span>
        <PriceBadge isFree={material.isFree} price={material.price} />
      </div>

      <h3 className="relative line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink-900 transition-colors duration-150 group-hover:text-brand-700">
        {material.title}
      </h3>

      <p className="relative mt-1.5 line-clamp-1 text-sm text-ink-500">
        {material.course.title}
      </p>

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <TypeBadge type={material.type} />
        {material.academicYear && (
          <span className="badge-neutral">{material.academicYear}</span>
        )}
      </div>

      {/* ink-500 not ink-400: the lighter token measures 2.87:1 on white,
          below the 4.5:1 floor for text this size. */}
      <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-ink-100 pt-3.5 text-xs text-ink-500">
        <span className="flex min-w-0 items-center gap-1.5">
          {material.lecturerName ? (
            <>
              <User2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{material.lecturerName}</span>
            </>
          ) : (
            <>
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{material.course.department.name}</span>
            </>
          )}
        </span>

        <span className="flex shrink-0 items-center gap-1 tabular">
          <span className="flex items-center gap-1 transition-transform duration-200 ease-out group-hover:-translate-x-1">
            <Download className="h-3.5 w-3.5" />
            {material.downloadCount}
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 -translate-x-1 text-brand-600 opacity-0 transition-[transform,opacity] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100" />
        </span>
      </div>
    </Link>
  );
}
