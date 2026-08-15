'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Banknote,
  Bell,
  Coins,
  ExternalLink,
  FolderTree,
  Inbox,
  LayoutDashboard,
  Library,
  Link2,
  LogOut,
  Megaphone,
  Menu,
  Receipt,
  ShieldAlert,
  Sparkles,
  Upload,
  Users,
  X,
} from 'lucide-react';
import Logo from '@/components/brand/logo';
import { cn, firstName } from '@/lib/utils';

/**
 * Icons are looked up by name rather than passed in as components — a server
 * layout can't hand a function to a client component.
 */
const ICONS = {
  overview: LayoutDashboard,
  queue: Inbox,
  library: Library,
  users: Users,
  taxonomy: FolderTree,
  revenue: Banknote,
  affiliate: Link2,
  reports: ShieldAlert,
  announcements: Megaphone,
  boosts: Sparkles,
  points: Coins,
  purchases: Receipt,
  uploads: Upload,
  alerts: Bell,
} as const;

export type NavIcon = keyof typeof ICONS;

export type NavItem = {
  href: string;
  label: string;
  badge?: number;
  icon?: NavIcon;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((p) => !/^(dr|prof|mr|mrs|ms|rev)\.?$/i.test(p))
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function DashNav({
  items,
  roleLabel,
  userName,
}: {
  items: NavItem[];
  roleLabel: string;
  userName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => setOpen(false), [pathname]);

  // Only the longest matching href wins, so an index route like /dashboard
  // doesn't light up alongside /dashboard/purchases.
  const activeHref = items
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const isActive = (href: string) => href === activeHref;

  const links = (idPrefix: string) => (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon ? ICONS[item.icon] : null;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors duration-150',
              active ? 'text-white' : 'text-ink-600 hover:text-ink-900'
            )}
          >
            {/* A single indicator that travels between items rather than one
                background per link fading in and out. */}
            {active && (
              <motion.span
                layoutId={`${idPrefix}-indicator`}
                className="absolute inset-0 -z-10 rounded-[10px] bg-brand-600 shadow-button"
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: 'spring', duration: 0.4, bounce: 0.15 }
                }
              />
            )}
            {!active && (
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-[10px] bg-ink-100 opacity-0 transition-opacity duration-150 hover:opacity-100"
              />
            )}
            {Icon && (
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  active ? 'text-white' : 'text-ink-400'
                )}
              />
            )}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.badge ? (
              <span
                className={cn(
                  'tabular min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none',
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-gold-400 text-ink-900 ring-1 ring-inset ring-gold-600/25'
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/85 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo compact priority />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-500">{roleLabel}</span>
            <button
              onClick={() => setOpen((v) => !v)}
              className="btn-ghost"
              aria-label="Toggle navigation"
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: reduced ? 0 : 0.28, ease: [0.32, 0.72, 0, 1] },
                opacity: { duration: reduced ? 0 : 0.18 },
              }}
              className="overflow-hidden border-t border-ink-100"
            >
              <div className="p-3">
                {links('mobile')}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="mt-2 flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm text-ink-500 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-ink-200/70 bg-white px-4 py-5 lg:flex">
        <div className="px-1.5">
          <Logo priority />
        </div>

        <p className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
          {roleLabel}
        </p>
        <div className="flex-1">{links('desktop')}</div>

        <div className="mt-6 space-y-1 border-t border-ink-100 pt-4">
          <Link
            href="/browse"
            className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm text-ink-500 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-900"
          >
            <ExternalLink className="h-4 w-4 text-ink-400" />
            View public site
          </Link>

          <div className="flex items-center gap-2.5 rounded-xl bg-ink-50 px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white shadow-button">
              {initials(userName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink-900">
                {firstName(userName)}
              </span>
              <span className="block truncate text-xs text-ink-500">{roleLabel}</span>
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm text-ink-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
