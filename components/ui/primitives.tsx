import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MATERIAL_TYPE_LABELS } from '@/lib/config';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink-900 sm:text-[34px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2.5 text-[15px] leading-relaxed text-ink-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 px-6 py-16 text-center">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent"
      />
      {icon && <div className="relative mb-3.5 text-ink-300">{icon}</div>}
      <p className="relative font-medium text-ink-800">{title}</p>
      {description && (
        <p className="relative mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">
          {description}
        </p>
      )}
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent = 'brand',
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'brand' | 'gold' | 'emerald' | 'ink';
}) {
  const dot = {
    brand: 'bg-brand-600',
    gold: 'bg-gold-500',
    emerald: 'bg-emerald-500',
    ink: 'bg-ink-400',
  }[accent];
  const wash = {
    brand: 'from-brand-50/80',
    gold: 'from-gold-50',
    emerald: 'from-emerald-50/80',
    ink: 'from-ink-50',
  }[accent];

  return (
    <div className="card relative overflow-hidden p-5">
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-b to-transparent blur-2xl',
          wash
        )}
      />
      <p className="relative flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-500">
        <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
        {label}
      </p>
      <p className="tabular relative mt-2.5 font-display text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink-900">
        {value}
      </p>
      {sub && <p className="relative mt-2 text-xs text-ink-500">{sub}</p>}
    </div>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return <span className="badge-brand">{MATERIAL_TYPE_LABELS[type] ?? type}</span>;
}

export function PriceBadge({
  isFree,
  price,
}: {
  isFree: boolean;
  price?: number | string | null;
}) {
  if (isFree) return <span className="badge-free">Free</span>;
  return (
    <span className="badge-paid">
      GHS {Number(price ?? 0).toFixed(2)}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    APPROVED: 'badge-free',
    ACTIVE: 'badge-free',
    PENDING: 'badge-pending',
    REJECTED: 'badge-rejected',
    EXPIRED: 'badge-neutral',
    CANCELLED: 'badge-neutral',
  };
  return <span className={map[status] ?? 'badge-neutral'}>{status.toLowerCase()}</span>;
}

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-ink-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {item.href ? (
              <Link
                href={item.href}
                className="rounded px-1.5 py-1 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-900"
              >
                {item.label}
              </Link>
            ) : (
              <span className="px-1.5 py-1 font-medium text-ink-800">
                {item.label}
              </span>
            )}
            {i < items.length - 1 && (
              <span aria-hidden className="text-ink-300">
                ›
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warn' | 'danger' | 'success';
  title?: string;
  children: React.ReactNode;
}) {
  const tones = {
    info: 'bg-brand-50/70 text-brand-900 ring-brand-600/15',
    warn: 'bg-gold-50 text-gold-900 ring-gold-600/25',
    danger: 'bg-red-50/80 text-red-900 ring-red-600/15',
    success: 'bg-emerald-50/80 text-emerald-900 ring-emerald-600/15',
  }[tone];
  return (
    <div
      className={cn(
        'rounded-xl px-4 py-3.5 text-sm ring-1 ring-inset',
        tones
      )}
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="leading-relaxed opacity-90">{children}</div>
    </div>
  );
}
