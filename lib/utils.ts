import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PLATFORM } from './config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `${PLATFORM.currency} ${n.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBytes(bytes: number) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * The only URL a download should ever be offered from.
 *
 * Every download goes through /api/files, which runs the access check before
 * releasing anything. Linking to a stored fileUrl is not safe: with R2 and a
 * public base URL configured that value is a direct bucket link, and it gets
 * rendered into the page, so a paid material could be fetched without paying.
 *
 * Segments are encoded individually so slashes stay path separators — the route
 * decodes each one back.
 */
export function downloadPath(fileKey: string) {
  return `/api/files/${fileKey.split('/').map(encodeURIComponent).join('/')}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const HONORIFICS = ['dr.', 'dr', 'prof.', 'prof', 'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms', 'rev.', 'rev'];

/** "Dr. Kwabena Mensah" → "Kwabena", so greetings don't say "Welcome, Dr." */
export function firstName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts.find((p) => !HONORIFICS.includes(p.toLowerCase()));
  return first ?? parts[0] ?? fullName;
}

export function relativeTime(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

import type { Decimal } from '@prisma/client/runtime/library';

/** Prisma Decimal → string, Date → string, recursively. */
export type Plain<T> = T extends Decimal | Date
  ? string
  : T extends Array<infer U>
    ? Plain<U>[]
    : T extends object
      ? { [K in keyof T]: Plain<T[K]> }
      : T;

/** Serialise Prisma Decimal/Date values before handing data to client components. */
export function plain<T>(value: T): Plain<T> {
  return JSON.parse(JSON.stringify(value));
}
