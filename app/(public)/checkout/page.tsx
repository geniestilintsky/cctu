import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Lock, Sparkles, ShieldCheck, Smartphone } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { hasActiveSubscription } from '@/lib/access';
import { startMaterialCheckout, startSubscriptionCheckout } from '@/app/actions/payment-actions';
import { SEMESTER_PASS, MATERIAL_TYPE_LABELS } from '@/lib/config';
import { formatMoney } from '@/lib/utils';
import { isLive } from '@/lib/paystack';
import { PageHeader, Callout } from '@/components/ui/primitives';
import SubmitButton from '@/components/ui/submit-button';

export const metadata = { title: 'Checkout' };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { material?: string };
}) {
  const user = await requireUser();
  const materialId = searchParams.material;

  const [material, activeSub] = await Promise.all([
    materialId
      ? prisma.material.findUnique({
          where: { id: materialId },
          include: { course: { select: { code: true, title: true } } },
        })
      : null,
    hasActiveSubscription(user.id),
  ]);

  if (materialId && !material) redirect('/browse');
  if (material?.isFree) redirect(`/material/${material.id}`);
  if (material && activeSub) redirect(`/material/${material.id}`);

  return (
    <div className="container-page max-w-4xl py-10">
      <PageHeader
        title={material ? 'Unlock this material' : 'Get a Semester Pass'}
        description="Pay with a card or Mobile Money (MTN, Telecel, AirtelTigo) through Paystack."
      />

      {!isLive() && (
        <div className="mb-6">
          <Callout tone="warn" title="Sandbox mode">
            No Paystack key is configured, so checkout resolves locally instead of
            charging anyone. Add <code>PAYSTACK_SECRET_KEY</code> to{' '}
            <code>.env</code> to go live — no code changes needed.
          </Callout>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {material && (
          <div className="card p-6">
            <span className="badge-brand">
              {MATERIAL_TYPE_LABELS[material.type]}
            </span>
            <h2 className="mt-3 font-display text-xl font-semibold text-ink-900">
              {material.title}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {material.course.code} — {material.course.title}
            </p>

            <div className="my-6 border-y border-ink-100 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-600">One-time unlock</span>
                <span className="font-display text-2xl font-semibold text-ink-900">
                  {formatMoney(material.price?.toString())}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                Yours permanently — re-download any time from your dashboard.
              </p>
            </div>

            <form action={startMaterialCheckout}>
              <input type="hidden" name="materialId" value={material.id} />
              <SubmitButton className="btn-primary w-full" pendingLabel="Redirecting…">
                <Lock className="h-4 w-4" />
                Pay {formatMoney(material.price?.toString())}
              </SubmitButton>
            </form>
          </div>
        )}

        <div className={material ? 'card border-gold-300 p-6' : 'card p-6 md:col-span-2'}>
          <span className="badge-paid">
            <Sparkles className="h-3 w-3" /> Best value
          </span>
          <h2 className="mt-3 font-display text-xl font-semibold text-ink-900">
            {SEMESTER_PASS.plan}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Unlimited access to every paid material for {SEMESTER_PASS.days} days.
          </p>

          <div className="my-6 border-y border-ink-100 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-600">One semester</span>
              <span className="font-display text-2xl font-semibold text-ink-900">
                {formatMoney(SEMESTER_PASS.price)}
              </span>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-600">
              <li>· Every past paper, handout, tutorial and book</li>
              <li>· New uploads unlocked automatically</li>
              <li>· Cancel any time — no auto-charge without notice</li>
            </ul>
          </div>

          {activeSub ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              Your pass is already active until{' '}
              {new Date(activeSub.expiresAt).toLocaleDateString()}.
            </p>
          ) : (
            <form action={startSubscriptionCheckout}>
              <SubmitButton className="btn-gold w-full" pendingLabel="Redirecting…">
                Get the {SEMESTER_PASS.plan}
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-6 text-xs text-ink-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Payments handled by Paystack — we never see your card details
        </span>
        <span className="flex items-center gap-1.5">
          <Smartphone className="h-4 w-4 text-brand-500" />
          MTN MoMo, Telecel Cash and AirtelTigo Money supported
        </span>
        <Link href="/browse" className="ml-auto hover:text-ink-800">
          ← Back to browsing
        </Link>
      </div>
    </div>
  );
}
