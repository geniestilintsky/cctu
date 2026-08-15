'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Shared entrance for landing-page blocks. Framer Motion handles the discrete
 * "appears once" reveals; GSAP ScrollTrigger handles the scrubbed, scroll-linked
 * storytelling in the hero and problem sections.
 *
 * The travel is written as a full `transform` string rather than the `y`
 * shorthand — the shorthand animates on the main thread, so it drops frames
 * while the page is still loading, which is exactly when these fire.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        reduced
          ? { opacity: 0 }
          : { opacity: 0, transform: `translateY(${y}px)` }
      }
      whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
