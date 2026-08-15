'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, X, Search, LogOut, LayoutDashboard } from 'lucide-react';
import Logo from '@/components/brand/logo';
import { ROLE_HOME, ROLE_LABELS } from '@/lib/config';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/browse', label: 'Browse' },
  { href: '/upload', label: 'Upload' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/policy', label: 'Policy' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion();
  const role = session?.user?.role;

  // The border and blur only appear once the page has moved — at rest the
  // header should sit on the hero without a seam.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile sheet on navigation.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300',
        scrolled
          ? 'border-b border-ink-200/70 bg-white/80 shadow-xs backdrop-blur-xl supports-[backdrop-filter]:bg-white/65'
          : 'border-b border-transparent bg-white/0'
      )}
      style={{ transitionTimingFunction: 'var(--ease-out)' }}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo priority />

        <nav className="hidden items-center md:flex">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150',
                  active ? 'text-brand-700' : 'text-ink-600 hover:text-ink-900'
                )}
              >
                {/* One shared pill that slides between items rather than four
                    that fade in and out. */}
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-lg bg-brand-50"
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: 'spring', duration: 0.4, bounce: 0.18 }
                    }
                  />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1.5 md:flex">
          <Link href="/browse" className="btn-ghost" aria-label="Search materials">
            <Search className="h-4 w-4" />
          </Link>
          {status === 'loading' ? (
            <div className="h-9 w-28 animate-pulse rounded-[10px] bg-ink-100" />
          ) : session ? (
            <>
              <Link href={ROLE_HOME[role ?? 'STUDENT']} className="btn-outline">
                <LayoutDashboard className="h-4 w-4" />
                {ROLE_LABELS[role ?? 'STUDENT']}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-ghost"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in" className="btn-ghost">
                Sign in
              </Link>
              <Link href="/auth/sign-up" className="btn-primary">
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          className="btn-ghost md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: reduced ? 0 : 0.28, ease: [0.32, 0.72, 0, 1] },
              opacity: { duration: reduced ? 0 : 0.18 },
            }}
            className="overflow-hidden border-t border-ink-200/70 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <div className="container-page flex flex-col gap-0.5 py-3">
              {NAV.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reduced ? 0 : 0.04 + i * 0.035,
                    duration: 0.2,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      pathname.startsWith(item.href)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-700 active:bg-ink-100'
                    )}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              <div className="mt-2 flex gap-2 border-t border-ink-100 pt-3">
                {session ? (
                  <>
                    <Link
                      href={ROLE_HOME[role ?? 'STUDENT']}
                      className="btn-outline flex-1"
                    >
                      <LayoutDashboard className="h-4 w-4" /> My dashboard
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="btn-ghost"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/sign-in" className="btn-outline flex-1">
                      Sign in
                    </Link>
                    <Link href="/auth/sign-up" className="btn-primary flex-1">
                      Create account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
