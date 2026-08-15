import { prisma } from '@/lib/prisma';
import { deleteAffiliateLink } from '@/app/actions/admin-actions';
import { formatMoney, plain } from '@/lib/utils';
import { PageHeader, Stat, EmptyState, Callout } from '@/components/ui/primitives';
import AffiliateForm, { AffiliateRecord } from '@/components/admin/affiliate-form';
import ConfirmButton from '@/components/ui/confirm-button';

export const metadata = { title: 'Affiliate links' };
export const dynamic = 'force-dynamic';

export default async function AffiliateLinksPage() {
  const links = await prisma.affiliateLink.findMany({
    orderBy: [{ active: 'desc' }, { clicks: 'desc' }],
  });

  const clicks = links.reduce((n, l) => n + l.clicks, 0);
  const conversions = links.reduce((n, l) => n + l.conversions, 0);
  const revenue = links.reduce((n, l) => n + Number(l.revenue), 0);
  const rate = clicks ? ((conversions / clicks) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <PageHeader
        title="Affiliate links"
        description="Contextual recommendations shown after a download. Clicks are tracked automatically; conversions arrive from the partner postback."
        action={<AffiliateForm />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Active links" value={links.filter((l) => l.active).length} accent="brand" />
        <Stat label="Clicks" value={clicks} accent="gold" />
        <Stat label="Conversions" value={conversions} sub={`${rate}% of clicks`} accent="emerald" />
        <Stat label="Affiliate revenue" value={formatMoney(revenue)} accent="ink" />
      </div>

      <div className="mb-6">
        <Callout tone="info" title="Recording conversions">
          Point your affiliate partner&apos;s postback at{' '}
          <code>/api/affiliate/postback?id=&lt;link id&gt;&amp;amount=&lt;value&gt;</code>{' '}
          (set <code>AFFILIATE_POSTBACK_SECRET</code> and pass it as{' '}
          <code>&amp;secret=</code>). Revenue then flows into this table and the
          revenue dashboard.
        </Callout>
      </div>

      {links.length === 0 ? (
        <EmptyState
          title="No affiliate links yet"
          description="Add a study tool or service you earn commission from."
        />
      ) : (
        <div className="space-y-6">
          {links.map((l) => (
            <div key={l.id} className="space-y-2">
              <AffiliateForm link={plain(l) as unknown as AffiliateRecord} />
              <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-ink-500">
                <span>{l.clicks} clicks</span>
                <span>{l.conversions} conversions</span>
                <span>{formatMoney(l.revenue.toString())} earned</span>
                <span className="font-mono">id: {l.id}</span>
                <form action={deleteAffiliateLink} className="ml-auto">
                  <input type="hidden" name="id" value={l.id} />
                  <ConfirmButton
                    className="btn-ghost btn-sm text-ink-400 hover:text-red-600"
                    message={`Delete “${l.label}”? Its click history goes with it.`}
                  >
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
