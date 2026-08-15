import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatMoney, formatDate } from '@/lib/utils';
import { PageHeader, Stat } from '@/components/ui/primitives';
import RevenueChart, { MonthPoint } from '@/components/admin/revenue-chart';

export const metadata = { title: 'Revenue' };
export const dynamic = 'force-dynamic';

export default async function RevenuePage() {
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);

  const [settled, purchaseAgg, subAgg, activeSubs, affiliates, recent, topMaterials] =
    await Promise.all([
      prisma.paymentIntent.findMany({
        where: { status: 'PAID', settledAt: { gte: since } },
        select: { amount: true, kind: true, settledAt: true },
      }),
      prisma.purchase.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
      prisma.subscription.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
      prisma.subscription.count({
        where: { status: 'ACTIVE', expiresAt: { gt: new Date() } },
      }),
      prisma.affiliateLink.findMany({
        orderBy: { clicks: 'desc' },
        select: {
          id: true,
          label: true,
          clicks: true,
          conversions: true,
          revenue: true,
          placement: true,
        },
      }),
      prisma.purchase.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { name: true } },
          material: { select: { title: true, course: { select: { code: true } } } },
        },
      }),
      prisma.purchase.groupBy({
        by: ['materialId'],
        _sum: { amount: true },
        _count: { _all: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
    ]);

  const topTitles = await prisma.material.findMany({
    where: { id: { in: topMaterials.map((t) => t.materialId) } },
    select: { id: true, title: true, course: { select: { code: true } } },
  });

  // Bucket settled payments into the last 12 months.
  const months: MonthPoint[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < 12; i++) {
    months.push({
      label: cursor.toLocaleDateString('en-GB', { month: 'short' }),
      material: 0,
      subscription: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  settled.forEach((p) => {
    if (!p.settledAt) return;
    const idx =
      (p.settledAt.getFullYear() - since.getFullYear()) * 12 +
      (p.settledAt.getMonth() - since.getMonth());
    if (idx < 0 || idx > 11) return;
    const amount = Number(p.amount);
    if (p.kind === 'MATERIAL') months[idx].material += amount;
    else months[idx].subscription += amount;
  });

  const materialRevenue = Number(purchaseAgg._sum.amount ?? 0);
  const subRevenue = Number(subAgg._sum.amount ?? 0);
  const affiliateRevenue = affiliates.reduce((n, a) => n + Number(a.revenue), 0);
  const totalClicks = affiliates.reduce((n, a) => n + a.clicks, 0);
  const totalConversions = affiliates.reduce((n, a) => n + a.conversions, 0);

  return (
    <div>
      <PageHeader
        title="Revenue"
        description="Pay-per-item unlocks, Semester Pass subscriptions and affiliate performance — the numbers behind the revenue-share conversation with the school."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total revenue"
          value={formatMoney(materialRevenue + subRevenue + affiliateRevenue)}
          sub="All sources, all time"
          accent="brand"
        />
        <Stat
          label="Material sales"
          value={formatMoney(materialRevenue)}
          sub={`${purchaseAgg._count._all} unlocks`}
          accent="emerald"
        />
        <Stat
          label="Subscriptions"
          value={formatMoney(subRevenue)}
          sub={`${activeSubs} active now`}
          accent="gold"
        />
        <Stat
          label="Affiliate"
          value={formatMoney(affiliateRevenue)}
          sub={`${totalClicks} clicks · ${totalConversions} conversions`}
          accent="ink"
        />
      </div>

      <div className="mb-8">
        <RevenueChart data={months} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
            Best selling materials
          </h2>
          <div className="table-wrap">
            <table className="table min-w-0">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Sales</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topMaterials.map((t) => {
                  const info = topTitles.find((m) => m.id === t.materialId);
                  return (
                    <tr key={t.materialId}>
                      <td className="max-w-[260px]">
                        <Link
                          href={`/material/${t.materialId}`}
                          className="line-clamp-1 font-medium text-ink-900 hover:text-brand-700"
                        >
                          {info?.title ?? 'Deleted material'}
                        </Link>
                        <span className="font-mono text-xs text-ink-500">
                          {info?.course.code}
                        </span>
                      </td>
                      <td>{t._count._all}</td>
                      <td className="text-right font-medium">
                        {formatMoney(t._sum.amount?.toString())}
                      </td>
                    </tr>
                  );
                })}
                {topMaterials.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-ink-400">
                      No sales yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
            Affiliate performance
          </h2>
          <div className="table-wrap">
            <table className="table min-w-0">
              <thead>
                <tr>
                  <th>Link</th>
                  <th>Clicks</th>
                  <th>Conv.</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((a) => (
                  <tr key={a.id}>
                    <td className="max-w-[220px]">
                      <p className="line-clamp-1 font-medium text-ink-900">{a.label}</p>
                      <span className="text-xs text-ink-500">{a.placement}</span>
                    </td>
                    <td>{a.clicks}</td>
                    <td>{a.conversions}</td>
                    <td className="text-right font-medium">
                      {formatMoney(a.revenue.toString())}
                    </td>
                  </tr>
                ))}
                {affiliates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-ink-400">
                      No affiliate links configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
          Recent purchases
        </h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Material</th>
                <th>Reference</th>
                <th>Date</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium text-ink-900">{p.user.name}</td>
                  <td className="max-w-[260px]">
                    <span className="line-clamp-1">{p.material.title}</span>
                    <span className="font-mono text-xs text-ink-500">
                      {p.material.course.code}
                    </span>
                  </td>
                  <td className="font-mono text-xs">{p.paystackRef}</td>
                  <td className="whitespace-nowrap text-xs">{formatDate(p.createdAt)}</td>
                  <td className="text-right font-medium">
                    {formatMoney(p.amount.toString())}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-ink-400">
                    No purchases yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
