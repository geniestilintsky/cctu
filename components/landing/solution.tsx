'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FolderTree,
  ShieldCheck,
  BellRing,
  Sparkles,
  Users,
  CreditCard,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const PILLARS = [
  {
    icon: FolderTree,
    title: 'One structure, the school’s own',
    body: 'Faculty → department → course → year → material type. The same taxonomy the registrar uses, so nothing gets filed in the wrong place.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified before it goes live',
    body: 'Lecturer and TA uploads publish instantly. Student uploads queue for review, with a reason sent back if they are rejected.',
  },
  {
    icon: BellRing,
    title: 'Alerts that follow the course',
    body: 'Students subscribe to a course or a lecturer and get announcements by email today — WhatsApp in Phase 2, same list.',
  },
  {
    icon: Users,
    title: 'Lecturers keep control',
    body: 'Up to three teaching assistants per lecturer, with identical permissions and every action logged back to the lecturer.',
  },
  {
    icon: Sparkles,
    title: 'Contribution earns points',
    body: 'Verified uploads earn points a student can ask a lecturer to consider — the lecturer decides each request individually.',
  },
  {
    icon: CreditCard,
    title: 'Paid or free, your call',
    body: 'Free materials download with no account. Paid ones unlock per item or with a Semester Pass, via card or Mobile Money.',
  },
];

export default function Solution() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        ScrollTrigger.batch('[data-pillar]', {
          start: 'top 88%',
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.09,
              ease: 'power3.out',
              overwrite: true,
            }),
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-pillar]', { opacity: 1, y: 0 });
      });

      return () => mm.revert();
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-ink-950 py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(var(--aurora-blue)/0.28),transparent_65%)]"
      />

      <div className="container-page relative">
        <div className="max-w-2xl">
          <h2 className="font-display text-[clamp(1.9rem,3.8vw,2.9rem)] font-semibold leading-[1.06] tracking-[-0.032em] text-white text-balance">
            One place the whole campus can trust.
          </h2>
          <p className="mt-5 text-[17px] leading-[1.65] text-ink-300">
            StudyHub is not another file dump. It mirrors how the university is
            actually organised, and puts a lecturer or an administrator behind
            every item that goes live.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              data-pillar
              style={{ opacity: 0, transform: 'translateY(24px)' }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-sm transition-[border-color,background-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-gold-400/35 hover:bg-white/[0.07]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <span className="inline-flex rounded-xl bg-gold-400/12 p-3 text-gold-400 ring-1 ring-inset ring-gold-400/20">
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold tracking-[-0.015em] text-white">
                {p.title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-400">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
