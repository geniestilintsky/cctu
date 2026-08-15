/**
 * Fixed-window rate limiter.
 *
 * Deliberately in-process and dependency-free: it stops password guessing and
 * signup floods against a single server, which is what this deployment is.
 *
 * LIMITATION — the counter lives in this process's memory. Behind more than one
 * instance each gets its own allowance, and a restart clears them. Before
 * scaling out, back this with Redis (Upstash) keeping the same call signature;
 * every caller here works unchanged.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Bounded so a flood of unique keys cannot grow the map without limit.
const MAX_KEYS = 10_000;

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_KEYS) sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count > limit) {
    return { allowed: false, remaining: 0, retryAfter };
  }
  return { allowed: true, remaining: limit - existing.count, retryAfter };
}

/** Clears a key early — call after a successful sign-in so one typo-prone but
 *  legitimate user is not locked out by their own earlier mistakes. */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}

/**
 * Best-effort client IP. x-forwarded-for is spoofable unless a trusted proxy
 * sets it, so treat this as a throttling hint, not an identity.
 */
export function clientIp(
  headers: Headers | Record<string, unknown> | undefined
): string {
  const read = (name: string): string | undefined => {
    if (!headers) return undefined;
    // Web `Headers` (route handlers) vs a plain object (NextAuth's authorize).
    if (typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get(name) ?? undefined;
    }
    const value = (headers as Record<string, unknown>)[name];
    return typeof value === 'string' ? value : undefined;
  };

  const forwarded = read('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return read('x-real-ip') || 'unknown';
}

/** Sign-in: slow enough to make guessing impractical, loose enough for typos. */
export const SIGN_IN_LIMIT = { limit: 8, windowMs: 10 * 60 * 1000 };

/** Account creation: a human needs one, a script wants hundreds. */
export const REGISTER_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };
