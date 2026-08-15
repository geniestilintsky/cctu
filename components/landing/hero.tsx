'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { ArrowRight, Search } from 'lucide-react';
import { PLATFORM } from '@/lib/config';

gsap.registerPlugin(ScrollTrigger);

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export default function Hero({
  materialCount,
  courseCount,
  facultyCount,
}: {
  materialCount: number;
  courseCount: number;
  facultyCount: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Decorative crest tilt. Springs give the movement momentum — tying rotation
  // straight to the pointer feels mechanical.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springCfg = { stiffness: 90, damping: 14, mass: 0.9 };
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-14, 14]), springCfg);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [10, -10]), springCfg);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to('[data-hero-crest]', {
          yPercent: 20,
          scale: 1.05,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        });

        gsap.to('[data-hero-copy]', {
          yPercent: -12,
          opacity: 0.2,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        });

        gsap.to('[data-hero-aurora]', {
          yPercent: 26,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });

      return () => mm.revert();
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      onPointerMove={(e) => {
        if (reduced) return;
        const r = e.currentTarget.getBoundingClientRect();
        pointerX.set((e.clientX - r.left) / r.width - 0.5);
        pointerY.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      className="relative isolate -mt-16 overflow-hidden bg-ink-950 pb-24 pt-36 sm:pb-32 sm:pt-44"
    >
      {/* Atmosphere is one aurora wash. Colours come from the token layer
          rather than one-off rgba literals. */}
      <div
        data-hero-aurora
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_46%_at_78%_12%,rgb(var(--aurora-blue)/0.45),transparent_64%),radial-gradient(46%_42%_at_12%_88%,rgb(var(--aurora-gold)/0.22),transparent_62%),radial-gradient(70%_60%_at_50%_-10%,rgb(var(--aurora-sky)/0.18),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/[0.04] to-transparent"
      />

      <div className="container-page relative grid items-center gap-16 lg:grid-cols-[1.12fr_1fr]">
        <div data-hero-copy>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.06] py-1.5 pl-2 pr-3.5 text-xs font-medium text-white/75 backdrop-blur-md"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-gold-400" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-400" />
            </span>
            Built for {PLATFORM.university}
          </motion.div>

          <h1 className="max-w-[19ch] font-display text-[clamp(2.6rem,6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-white">
            {['Every past question,', 'filed where you’d'].map((line, i) => (
              <motion.span
                key={line}
                className="block"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.06 + i * 0.08, ease: EASE_OUT }}
              >
                {line}
              </motion.span>
            ))}
            <motion.span
              className="block text-gold-400"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: EASE_OUT }}
            >
              actually look for it.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT }}
            className="mt-7 max-w-lg text-[17px] leading-[1.65] text-ink-300"
          >
            Exams, quizzes, handouts, tutorials, books and theses for every CCTU
            course — uploaded by lecturers, checked before they go live, and
            organised by faculty, department and year.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38, ease: EASE_OUT }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link href="/browse" className="btn-gold btn-lg group">
              <Search className="h-4 w-4" />
              Find my course
              <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/auth/sign-up"
              className="btn btn-lg border border-white/15 bg-white/[0.06] text-white backdrop-blur-md transition-colors hover:bg-white/[0.11]"
            >
              Create a free account
            </Link>
          </motion.div>

          {/* One line of fact rather than a metric block. Inline text cannot
              overflow the way a fixed-padding flex rail did at 375px, and it
              keeps the eye on the headline. */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-10 max-w-lg border-t border-white/10 pt-6 text-[15px] leading-relaxed text-ink-300"
          >
            <span className="tabular font-semibold text-white">{materialCount}</span>{' '}
            materials across{' '}
            <span className="tabular font-semibold text-white">{courseCount}</span>{' '}
            courses in{' '}
            <span className="tabular font-semibold text-white">{facultyCount}</span>{' '}
            faculties. Free materials download without an account.
          </motion.p>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <motion.div
            data-hero-crest
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE_OUT }}
            style={{ perspective: 900 }}
            className="relative aspect-square w-60 sm:w-80 lg:w-[23rem]"
          >
            <div
              aria-hidden
              className="absolute inset-6 rounded-full bg-gold-400/12 blur-2xl"
            />
            <div
              aria-hidden
              className="absolute inset-0 rounded-full border border-white/10"
            />
            <div
              aria-hidden
              className="absolute inset-8 rounded-full border border-white/[0.06]"
            />
            <motion.div
              style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
              className="relative h-full w-full"
            >
              <Image
                src="/cctu-crest.png"
                alt={`${PLATFORM.university} crest`}
                fill
                priority
                sizes="(max-width: 1024px) 20rem, 23rem"
                className="object-contain drop-shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* white/55 clears 4.5:1 on ink-950; the old white/35 measured 3.19:1.
          The scroll cue is gone — it sat at 2.65:1 and said nothing. */}
      <div className="container-page relative mt-20">
        <p className="font-display text-sm italic text-white/55">
          “{PLATFORM.motto}” — {PLATFORM.mottoTranslation}
        </p>
      </div>
    </section>
  );
}
