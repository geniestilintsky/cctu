import Link from 'next/link';
import Image from 'next/image';
import { PLATFORM } from '@/lib/config';

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1fr_1.05fr]">
      <div className="flex items-center justify-center px-5 py-16 sm:px-8">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
            {title}
          </h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-ink-500">
            {subtitle}
          </p>
          <div className="mt-9">{children}</div>
          <p className="mt-7 text-sm text-ink-500">{footer}</p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(62%_52%_at_72%_18%,rgb(var(--aurora-blue)/0.38),transparent_62%),radial-gradient(52%_44%_at_18%_82%,rgb(var(--aurora-gold)/0.20),transparent_60%)]"
        />

        <div className="relative flex h-full flex-col justify-between p-14">
          <div className="flex items-center gap-3">
            <Image
              src="/cctu-crest.png"
              alt=""
              width={72}
              height={72}
              className="h-14 w-14 object-contain"
            />
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              {PLATFORM.universityShort}
              <span className="mt-0.5 block text-white/30">Learning materials</span>
            </span>
          </div>

          <div>
            <p className="max-w-lg font-display text-[clamp(1.9rem,2.6vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white text-balance">
              Stop hunting through WhatsApp groups for last year&apos;s paper.
            </p>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-300">
              {PLATFORM.name} keeps every past question, handout and tutorial
              filed under the right course — uploaded by lecturers, verified
              before it goes live.
            </p>
            <Link
              href="/browse"
              className="group mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-400 transition-colors hover:text-gold-300"
            >
              Browse without an account
              <span className="transition-transform duration-200 ease-out group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>

          <p className="font-display text-sm italic text-white/35">
            “{PLATFORM.motto}” — {PLATFORM.mottoTranslation}
          </p>
        </div>
      </div>
    </div>
  );
}
