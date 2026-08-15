'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CHATS = [
  { from: 'Ama', text: 'pls does anyone have CSC 204 past questions 🙏', mine: false },
  { from: 'Kwesi', text: 'check the 2019 group… i think Yaw posted it', mine: false },
  { from: 'You', text: 'which group? the one with 900 members?', mine: true },
  { from: 'Ama', text: 'scroll up small, it was around March', mine: false },
  { from: 'Kwesi', text: '*IMG_20240312_0043.jpg* (blurred)', mine: false },
  { from: 'You', text: "exam is tomorrow 😭", mine: true },
];

export default function Problem() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Messages stack up as you scroll — the chaos builds, then the
        // counter-statement lands.
        gsap.from('[data-chat]', {
          opacity: 0,
          y: 26,
          rotateZ: (i: number) => (i % 2 ? 1.2 : -1.2),
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: root.current,
            start: 'top 72%',
            end: 'center 55%',
            scrub: 0.8,
          },
        });

        gsap.from('[data-problem-line]', {
          opacity: 0,
          y: 24,
          stagger: 0.15,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: '[data-problem-line]', start: 'top 82%' },
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-chat], [data-problem-line]', { opacity: 1, y: 0 });
      });

      return () => mm.revert();
    }, root);

    return () => ctx.revert();
  }, []);

  // overflow-hidden: the -inset-8 glow behind the chat card paints past the
  // viewport at 375px and drags the page into horizontal scroll.
  return (
    <section ref={root} className="overflow-hidden bg-white py-24 sm:py-32">
      <div className="container-page grid gap-14 lg:grid-cols-2 lg:items-center">
        <div>
          <h2
            data-problem-line
            className="font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink-900 text-balance"
          >
            The material exists. Nobody can find it.
          </h2>
          <p
            data-problem-line
            className="mt-5 max-w-lg text-[17px] leading-[1.65] text-ink-600"
          >
            Past papers live in a WhatsApp group from two years ago. Handouts sit
            in one senior&apos;s laptop. The good tutorial pack is a photo of a
            photocopy. Every semester the same scramble starts again — usually
            the night before the paper.
          </p>

          <ul data-problem-line className="mt-8 space-y-3 text-ink-700">
            {[
              'Scattered across groups, drives and phones',
              'No way to tell a real 2023 paper from a rumour',
              'Nothing is tied to a course code or a lecturer',
              'Juniors start from zero every single year',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-br from-ink-100 via-white to-brand-50/40"
          />
          <div className="rotate-[0.6deg] rounded-[20px] border border-ink-200/80 bg-ink-50 p-4 shadow-float transition-transform duration-500 ease-out hover:rotate-0">
            <div className="mb-3 flex items-center gap-2 border-b border-ink-200 pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
                CS
              </span>
              <div>
                <p className="text-sm font-medium text-ink-900">
                  CSC 204 Level 200 (2019 batch)
                </p>
                <p className="text-xs text-ink-500">912 participants</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {CHATS.map((c, i) => (
                <div
                  key={i}
                  data-chat
                  className={`flex ${c.mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                      c.mine
                        ? 'rounded-br-sm bg-emerald-100 text-ink-800'
                        : 'rounded-bl-sm bg-white text-ink-800'
                    }`}
                  >
                    {!c.mine && (
                      <span className="mb-0.5 block text-xs font-semibold text-brand-700">
                        {c.from}
                      </span>
                    )}
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
