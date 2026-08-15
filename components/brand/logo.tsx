import Image from 'next/image';
import Link from 'next/link';
import { PLATFORM } from '@/lib/config';
import { cn } from '@/lib/utils';

export default function Logo({
  href = '/',
  tone = 'dark',
  compact = false,
  className,
  priority = false,
}: {
  href?: string | null;
  tone?: 'dark' | 'light';
  compact?: boolean;
  className?: string;
  /** Only the header logo is above the fold; the footer's should stay lazy. */
  priority?: boolean;
}) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src="/cctu-crest.png"
        alt={`${PLATFORM.universityShort} crest`}
        width={40}
        height={40}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        className="h-9 w-9 object-contain"
      />
      {!compact && (
        <span className="leading-tight">
          <span
            className={cn(
              'block font-display text-[17px] font-semibold tracking-tight',
              tone === 'light' ? 'text-white' : 'text-ink-900'
            )}
          >
            {PLATFORM.universityShort}{' '}
            <span className={tone === 'light' ? 'text-gold-400' : 'text-brand-600'}>
              StudyHub
            </span>
          </span>
          <span
            className={cn(
              'block text-[10px] uppercase tracking-[0.14em]',
              tone === 'light' ? 'text-white/55' : 'text-ink-500'
            )}
          >
            {PLATFORM.universityShort} learning materials
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="rounded-md">
      {content}
    </Link>
  );
}
