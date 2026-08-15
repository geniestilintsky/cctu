import Link from 'next/link';
import Logo from '@/components/brand/logo';
import { PLATFORM } from '@/lib/config';

const COLUMNS = [
  {
    title: 'Materials',
    links: [
      { href: '/browse', label: 'Browse all' },
      { href: '/browse?type=PAST_EXAM', label: 'Past exams' },
      { href: '/browse?type=HANDOUT', label: 'Handouts' },
      { href: '/browse?type=TUTORIAL', label: 'Tutorials' },
      { href: '/browse?type=BOOK', label: 'Books & theses' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/auth/sign-up', label: 'Create account' },
      { href: '/auth/sign-in', label: 'Sign in' },
      { href: '/upload', label: 'Upload material' },
      { href: '/pricing', label: 'Semester Pass' },
      { href: '/dashboard', label: 'My dashboard' },
    ],
  },
  {
    title: 'The platform',
    links: [
      { href: '/policy', label: 'Content & takedown policy' },
      { href: '/policy#points', label: 'Points & grade boosts' },
      { href: '/policy#privacy', label: 'Privacy' },
      { href: `mailto:${PLATFORM.supportEmail}`, label: 'Contact support' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/5 bg-ink-950 text-ink-300">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-px left-1/2 h-px w-[42rem] max-w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-gold-400/50 to-transparent"
      />
      <div className="container-page relative grid gap-10 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo href={null} tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
            Every past question, handout, tutorial and reading for{' '}
            {PLATFORM.university} — organised by faculty, department and course.
          </p>
          <p className="mt-4 font-display text-sm italic text-gold-400">
            “{PLATFORM.motto}”
          </p>
          <p className="text-xs text-ink-500">{PLATFORM.mottoTranslation}</p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
              {col.title}
            </p>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-ink-400 transition-colors duration-150 hover:text-gold-400"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative border-t border-white/5">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {PLATFORM.name}. Built for{' '}
            {PLATFORM.university}.
          </p>
          <p>
            Payments secured by Paystack · Cards & Mobile Money (MTN, Telecel,
            AirtelTigo)
          </p>
        </div>
      </div>
    </footer>
  );
}
