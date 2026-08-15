import Link from 'next/link';
import { Download, Sparkles, Upload, Bell, CreditCard } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { hasActiveSubscription } from '@/lib/access';
import { pointsBalance, spendablePoints } from '@/lib/points';
import { formatDate, formatMoney, firstName } from '@/lib/utils';
import { SEMESTER_PASS } from '@/lib/config';
import { PageHeader, Stat, EmptyState, StatusBadge } from '@/components/ui/primitives';

export const metadata = { title: 'My dashboard' };
export const dynamic = 'force-dynamic';

export default async function StudentDashboard() {
  const user = await requireRole('STUDENT', 'SUPER_ADMIN');

  const [purchases, uploads, sub, balance, spendable, subsCount, boosts] =
    await Promise.all([
      prisma.purchase.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          material: {
            select: { id: true, title: true, course: { select: { code: true } } },
          },
        },
      }),
      prisma.material.findMany({
        where: { uploadedById: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { course: { select: { code: true } } },
      }),
      hasActiveSubscription(user.id),
      pointsBalance(user.id),
      spendablePoints(user.id),
      prisma.notificationSubscription.count({
        where: { studentId: user.id, active: true },
      }),
      prisma.boostRequest.findMany({
        where: { studentId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { course: { select: { code: true } } },
      }),
    ]);

  return (
    <div>
      <PageHeader
        title={`Hi, ${firstName(user.name)}`}
        description="Your purchases, uploads, points and course alerts."
        action={
          <Link href="/browse" className="btn-primary">
            Browse materials
          </Link>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Purchases" value={purchases.length} accent="brand" />
        <Stat
          label="Points balance"
          value={balance}
          sub={`${spendable} available to commit`}
          accent="gold"
        />
        <Stat label="Uploads" value={uploads.length} accent="emerald" />
        <Stat label="Course alerts" value={subsCount} accent="ink" />
      </div>

      <div className="mb-8">
        {sub ? (
          <div className="card flex flex-wrap items-center justify-between gap-4 border-emerald-200 bg-emerald-50 p-5">
            <div>
              <p className="font-medium text-emerald-900">
                {sub.plan} active until {formatDate(sub.expiresAt)}
              </p>
              <p className="text-sm text-emerald-800">
                Every paid material is unlocked while your pass is valid.
              </p>
            </div>
            <Link href="/browse?price=paid" className="btn-outline">
              Browse paid materials
            </Link>
          </div>
        ) : (
          <div className="card flex flex-wrap items-center justify-between gap-4 border-gold-300 bg-gold-50 p-5">
            <div>
              <p className="font-medium text-ink-900">
                No {SEMESTER_PASS.plan} — you are paying per item
              </p>
              <p className="text-sm text-ink-600">
                {formatMoney(SEMESTER_PASS.price)} unlocks everything for{' '}
                {SEMESTER_PASS.days} days.
              </p>
            </div>
            <Link href="/checkout" className="btn-gold">
              <CreditCard className="h-4 w-4" />
              Get the pass
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <Download className="h-4 w-4 text-brand-600" />
              Recent purchases
            </h2>
            <Link
              href="/dashboard/purchases"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              All
            </Link>
          </div>
          {purchases.length === 0 ? (
            <EmptyState
              title="Nothing bought yet"
              description="Paid materials you unlock appear here for re-download any time."
            />
          ) : (
            <ul className="card divide-y divide-ink-100">
              {purchases.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/material/${p.material.id}`}
                      className="line-clamp-1 text-sm font-medium text-ink-900 hover:text-brand-700"
                    >
                      {p.material.title}
                    </Link>
                    <p className="font-mono text-xs text-ink-500">
                      {p.material.course.code} · {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-ink-700">
                    {formatMoney(p.amount.toString())}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <Upload className="h-4 w-4 text-brand-600" />
              My uploads
            </h2>
            <Link
              href="/upload"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Upload
            </Link>
          </div>
          {uploads.length === 0 ? (
            <EmptyState
              title="No uploads yet"
              description="Share a past paper or handout — verified uploads earn points."
              action={
                <Link href="/upload" className="btn-primary btn-sm">
                  Upload a material
                </Link>
              }
            />
          ) : (
            <ul className="card divide-y divide-ink-100">
              {uploads.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/material/${m.id}`}
                      className="line-clamp-1 text-sm font-medium text-ink-900 hover:text-brand-700"
                    >
                      {m.title}
                    </Link>
                    <p className="font-mono text-xs text-ink-500">
                      {m.course.code} · {formatDate(m.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
            <Sparkles className="h-4 w-4 text-brand-600" />
            Boost requests
          </h2>
          <Link
            href="/dashboard/points"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Points &amp; boosts
          </Link>
        </div>
        {boosts.length === 0 ? (
          <div className="card p-5 text-sm text-ink-500">
            You have not asked a lecturer to consider your points yet.{' '}
            <Link href="/dashboard/points" className="font-medium text-brand-700 hover:underline">
              Make a request
            </Link>
            .
          </div>
        ) : (
          <ul className="card divide-y divide-ink-100">
            {boosts.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm text-ink-800">
                  <span className="font-mono text-xs text-ink-500">{b.course.code}</span>{' '}
                  · {b.pointsUsed} points · {formatDate(b.createdAt)}
                </span>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/notifications" className="btn-outline">
          <Bell className="h-4 w-4" /> Manage course alerts
        </Link>
        <Link href="/upload" className="btn-outline">
          <Upload className="h-4 w-4" /> Upload a material
        </Link>
      </div>
    </div>
  );
}
