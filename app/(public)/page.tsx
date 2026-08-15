import Link from 'next/link';
import { ArrowRight, GraduationCap, Upload, Wallet } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { plain } from '@/lib/utils';
import { PLATFORM, SEMESTER_PASS, MATERIAL_TYPE_PLURALS } from '@/lib/config';
import Hero from '@/components/landing/hero';
import Problem from '@/components/landing/problem';
import Solution from '@/components/landing/solution';
import StatsStrip from '@/components/landing/stats-strip';
import Reveal from '@/components/landing/reveal';
import MaterialCard from '@/components/material/material-card';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const [materialCount, courseCount, facultyCount, downloads, latest, freeCount] =
    await Promise.all([
      prisma.material.count({ where: { status: 'APPROVED' } }),
      prisma.course.count(),
      prisma.faculty.count(),
      prisma.material.aggregate({ _sum: { downloadCount: true } }),
      prisma.material.findMany({
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 6,
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
      prisma.material.count({ where: { status: 'APPROVED', isFree: true } }),
    ]);

  return (
    <>
      <Hero
        materialCount={materialCount}
        courseCount={courseCount}
        facultyCount={facultyCount}
      />

      <Problem />

      <Solution />

      {/* Live preview of the real library */}
      <section className="bg-white py-24 sm:py-32">
        <div className="container-page">
          <Reveal className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-xl">
              <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink-900 text-balance">
                This is what browsing looks like.
              </h2>
              <p className="mt-5 text-[17px] leading-[1.65] text-ink-600">
                Filter by faculty, department, course, level, year and material
                type. {freeCount} of the {materialCount} items on the platform are
                free and download with no account at all.
              </p>
            </div>
            <Link href="/browse" className="btn-primary group">
              Open the library
              <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
            </Link>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((m, i) => (
              <Reveal key={m.id} delay={i * 0.05} className="h-full">
                <MaterialCard material={plain(m)} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-8 flex flex-wrap gap-2">
            {Object.entries(MATERIAL_TYPE_PLURALS).map(([value, label]) => (
              <Link
                key={value}
                href={`/browse?type=${value}`}
                className="rounded-lg border border-ink-200 px-3.5 py-2 text-xs font-medium text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {label}
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      <StatsStrip
        stats={[
          { value: materialCount, label: 'Materials published' },
          { value: courseCount, label: 'Courses covered' },
          { value: facultyCount, label: 'Faculties' },
          { value: downloads._sum.downloadCount ?? 0, label: 'Downloads served' },
        ]}
      />

      {/* How it works for each role */}
      <section className="bg-white py-24 sm:py-32">
        <div className="container-page">
          <Reveal>
            <h2 className="max-w-2xl font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink-900 text-balance">
              Three ways in, depending on who you are.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {[
              {
                icon: GraduationCap,
                role: 'Students',
                body: 'Search by course code, grab free materials without signing in, and unlock paid ones per item or with a Semester Pass.',
                cta: { href: '/browse', label: 'Browse materials' },
              },
              {
                icon: Upload,
                role: 'Lecturers & TAs',
                body: 'Publish straight to your course, post announcements to subscribers, and bring in up to three assistants whose work you can see.',
                cta: { href: '/auth/sign-in', label: 'Lecturer sign in' },
              },
              {
                icon: Wallet,
                role: 'The university',
                body: 'A moderated, branded library with a revenue dashboard, content-report handling and an audit trail behind every upload.',
                cta: { href: '/policy', label: 'Read the policy' },
              },
            ].map((item, i) => (
              <Reveal key={item.role} delay={i * 0.08} className="h-full">
                <div className="card group relative h-full overflow-hidden p-7">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-brand-50 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span className="relative inline-flex rounded-xl bg-brand-50 p-3 text-brand-600 ring-1 ring-inset ring-brand-600/10">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <h3 className="relative mt-5 font-display text-xl font-semibold tracking-[-0.015em] text-ink-900">
                    {item.role}
                  </h3>
                  <p className="relative mt-2.5 text-[15px] leading-relaxed text-ink-600">
                    {item.body}
                  </p>
                  <Link
                    href={item.cta.href}
                    className="relative -ml-2 mt-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                  >
                    {item.cta.label}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-ink-950 py-28 sm:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(52%_62%_at_50%_105%,rgb(var(--aurora-gold)/0.24),transparent_62%),radial-gradient(40%_50%_at_50%_-10%,rgb(var(--aurora-blue)/0.28),transparent_65%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-px left-1/2 h-px w-[36rem] max-w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-gold-400/60 to-transparent"
        />
        <div className="container-page relative text-center">
          <Reveal>
            <h2 className="mx-auto max-w-3xl font-display text-[clamp(2rem,4.2vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-white text-balance">
              Stop scrolling old group chats.
              <span className="block text-gold-400">Start with the course code.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-300">
              Free materials are open to everyone at {PLATFORM.universityShort}. A{' '}
              {SEMESTER_PASS.plan} at GHS {SEMESTER_PASS.price} unlocks the rest for
              the whole semester.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/browse" className="btn-gold btn-lg group">
                Browse materials
                <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/auth/sign-up"
                className="btn btn-lg border border-white/15 bg-white/[0.06] text-white backdrop-blur-md transition-colors hover:bg-white/[0.11]"
              >
                Create a free account
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
