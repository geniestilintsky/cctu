import Link from 'next/link';
import { Check, Smartphone } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { PLATFORM, SEMESTER_PASS } from '@/lib/config';
import { formatMoney } from '@/lib/utils';
import { PageHeader } from '@/components/ui/primitives';

export const metadata = {
  title: 'Pricing',
  description: `Free materials, per-item unlocks and the ${SEMESTER_PASS.plan} for ${PLATFORM.university}.`,
};
export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const [free, paid, avg] = await Promise.all([
    prisma.material.count({ where: { status: 'APPROVED', isFree: true } }),
    prisma.material.count({ where: { status: 'APPROVED', isFree: false } }),
    prisma.material.aggregate({
      where: { status: 'APPROVED', isFree: false },
      _avg: { price: true },
    }),
  ]);

  const tiers = [
    {
      name: 'Free',
      price: 'GHS 0',
      tag: `${free} materials`,
      description: 'No account, no payment, no catch.',
      features: [
        'Download any free material instantly',
        'No sign-in required',
        'Full search and filtering',
        'Report anything that should not be here',
      ],
      cta: { href: '/browse?price=free', label: 'Browse free materials' },
      highlight: false,
    },
    {
      name: 'Per item',
      price: `~${formatMoney(avg._avg.price?.toString() ?? 10)}`,
      tag: `${paid} paid materials`,
      description: 'Buy exactly what you need, keep it forever.',
      features: [
        'One-time unlock per material',
        'Re-download any time from your dashboard',
        'Card or Mobile Money via Paystack',
        'Your lecturer may award points for the purchase',
      ],
      cta: { href: '/browse?price=paid', label: 'See paid materials' },
      highlight: false,
    },
    {
      name: SEMESTER_PASS.plan,
      price: formatMoney(SEMESTER_PASS.price),
      tag: `${SEMESTER_PASS.days} days`,
      description: 'Everything unlocked for the whole semester.',
      features: [
        'Unlimited access to every paid material',
        'New uploads unlock automatically',
        'Best value from about 5 materials',
        'Cancel any time — no silent renewals',
      ],
      cta: { href: '/checkout', label: `Get the ${SEMESTER_PASS.plan}` },
      highlight: true,
    },
  ];

  return (
    <div className="container-page py-14">
      <PageHeader
        title="Free where it can be, paid where it earns its keep"
        description="Most of the library is free. Paid items fund moderation, storage and the people who keep it organised."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`card relative flex flex-col p-7 ${
              tier.highlight
                ? 'border-gold-300 shadow-lift ring-1 ring-gold-300/60 lg:-my-3 lg:py-10'
                : ''
            }`}
          >
            {tier.highlight && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent"
              />
            )}
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-ink-900">
                {tier.name}
              </h2>
              <span className={tier.highlight ? 'badge-paid' : 'badge-neutral'}>
                {tier.tag}
              </span>
            </div>
            <p className="tabular mt-5 font-display text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink-900">
              {tier.price}
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-500">
              {tier.description}
            </p>

            <ul className="mt-7 flex-1 space-y-3 text-sm text-ink-700">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={tier.cta.href}
              className={`mt-6 ${tier.highlight ? 'btn-gold' : 'btn-outline'}`}
            >
              {tier.cta.label}
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-8 flex items-center gap-2 text-sm text-ink-500">
        <Smartphone className="h-4 w-4 text-brand-500" />
        All payments run through Paystack — cards, MTN MoMo, Telecel Cash and
        AirtelTigo Money.
      </p>
    </div>
  );
}
