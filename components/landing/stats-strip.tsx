'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export type StatItem = { value: number; label: string; suffix?: string };

export default function StatsStrip({ stats }: { stats: StatItem[] }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
          const target = Number(el.dataset.count || 0);
          const counter = { value: 0 };
          gsap.to(counter, {
            value: target,
            duration: 1.4,
            ease: 'power2.out',
            snap: { value: 1 },
            onUpdate: () => {
              el.textContent = Math.round(counter.value).toLocaleString();
            },
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          });
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
          el.textContent = Number(el.dataset.count || 0).toLocaleString();
        });
      });

      return () => mm.revert();
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="border-y border-ink-200/80 bg-ink-50/70 py-16">
      <div className="container-page grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-ink-200">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`text-center sm:text-left ${i > 0 ? 'lg:pl-10' : ''}`}
          >
            <p className="tabular font-display text-[clamp(2.25rem,4vw,3rem)] font-semibold leading-none tracking-[-0.03em] text-ink-900">
              <span data-count={s.value}>0</span>
              {s.suffix}
            </p>
            <p className="mt-2.5 text-[13px] uppercase tracking-[0.12em] text-ink-500">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
