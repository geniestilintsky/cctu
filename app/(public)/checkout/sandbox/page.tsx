import { notFound } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { isLive } from '@/lib/paystack';
import { resolveSandboxPayment } from '@/app/actions/payment-actions';
import { formatMoney } from '@/lib/utils';
import SubmitButton from '@/components/ui/submit-button';

export const metadata = { title: 'Sandbox payment' };
export const dynamic = 'force-dynamic';

/**
 * Stand-in for the Paystack hosted checkout while no API key is configured.
 * It only exists in sandbox mode — with a live key, users are redirected to
 * Paystack itself and never see this page.
 */
export default async function SandboxCheckout({
  searchParams,
}: {
  searchParams: { reference?: string };
}) {
  if (isLive()) notFound();
  const user = await requireUser();
  const reference = searchParams.reference;
  if (!reference) notFound();

  const intent = await prisma.paymentIntent.findUnique({
    where: { reference },
    include: { material: { select: { title: true } } },
  });
  if (!intent || intent.userId !== user.id) notFound();

  return (
    <div className="container-page flex max-w-md flex-col items-center py-16">
      <div className="card w-full p-6">
        <div className="flex items-center gap-2 border-b border-ink-100 pb-4">
          <CreditCard className="h-5 w-5 text-brand-600" />
          <p className="font-medium text-ink-900">Simulated Paystack checkout</p>
        </div>

        <dl className="my-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-500">Item</dt>
            <dd className="font-medium text-ink-900">
              {intent.kind === 'MATERIAL' ? intent.material?.title : intent.plan}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-500">Amount</dt>
            <dd className="font-medium text-ink-900">
              {formatMoney(intent.amount.toString())}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-500">Reference</dt>
            <dd className="font-mono text-xs text-ink-600">{intent.reference}</dd>
          </div>
        </dl>

        <div className="flex gap-2">
          <form action={resolveSandboxPayment} className="flex-1">
            <input type="hidden" name="reference" value={reference} />
            <input type="hidden" name="outcome" value="success" />
            <SubmitButton className="btn-primary w-full" pendingLabel="Processing…">
              Approve payment
            </SubmitButton>
          </form>
          <form action={resolveSandboxPayment}>
            <input type="hidden" name="reference" value={reference} />
            <input type="hidden" name="outcome" value="fail" />
            <SubmitButton className="btn-outline">Decline</SubmitButton>
          </form>
        </div>

        <p className="mt-4 text-xs text-ink-500">
          Approving runs the same fulfilment code the live Paystack webhook calls.
        </p>
      </div>
    </div>
  );
}
