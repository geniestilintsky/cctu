import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { hasActiveSubscription } from '@/lib/access';
import { formatDate, formatMoney, downloadPath } from '@/lib/utils';
import { PageHeader, EmptyState, StatusBadge } from '@/components/ui/primitives';

export const metadata = { title: 'My purchases' };
export const dynamic = 'force-dynamic';

export default async function PurchasesPage() {
  const user = await requireRole('STUDENT', 'SUPER_ADMIN');

  const [purchases, subscriptions, active] = await Promise.all([
    prisma.purchase.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        material: {
          select: {
            id: true,
            title: true,
            fileKey: true,
            course: { select: { code: true } },
          },
        },
      },
    }),
    prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
    }),
    hasActiveSubscription(user.id),
  ]);

  const spent =
    purchases.reduce((n, p) => n + Number(p.amount), 0) +
    subscriptions.reduce((n, s) => n + Number(s.amount), 0);

  return (
    <div>
      <PageHeader
        title="My purchases"
        description={`Everything you have unlocked. Total spent: ${formatMoney(spent)}.`}
        action={
          !active && (
            <Link href="/checkout" className="btn-gold">
              Get a Semester Pass
            </Link>
          )
        }
      />

      <section className="mb-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
          Materials
        </h2>
        {purchases.length === 0 ? (
          <EmptyState
            title="No purchases yet"
            description="Paid materials you unlock stay available here permanently."
            action={
              <Link href="/browse?price=paid" className="btn-primary">
                Browse paid materials
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th className="text-right">Download</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="max-w-[280px]">
                      <Link
                        href={`/material/${p.material.id}`}
                        className="line-clamp-1 font-medium text-ink-900 hover:text-brand-700"
                      >
                        {p.material.title}
                      </Link>
                      <span className="font-mono text-xs text-ink-500">
                        {p.material.course.code}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{p.paystackRef}</td>
                    <td className="whitespace-nowrap text-xs">
                      {formatDate(p.createdAt)}
                    </td>
                    <td>{formatMoney(p.amount.toString())}</td>
                    <td className="text-right">
                      <a href={downloadPath(p.material.fileKey)} download className="btn-outline btn-sm">
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
          Subscriptions
        </h2>
        {subscriptions.length === 0 ? (
          <EmptyState
            title="No subscription history"
            description="A Semester Pass unlocks every paid material at once."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Started</th>
                  <th>Expires</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-ink-900">{s.plan}</td>
                    <td className="whitespace-nowrap text-xs">{formatDate(s.startedAt)}</td>
                    <td className="whitespace-nowrap text-xs">{formatDate(s.expiresAt)}</td>
                    <td>{formatMoney(s.amount.toString())}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
