import Link from 'next/link';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { confirmPayment } from '@/app/actions/payment-actions';
import { requireUser } from '@/lib/session';
import { formatMoney } from '@/lib/utils';

export const metadata = { title: 'Payment result' };
export const dynamic = 'force-dynamic';

export default async function CheckoutCallback({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const reference = params.reference || params.trxref;

  const result = reference
    ? await confirmPayment(reference)
    : ({ status: 'unknown' } as const);

  const paid = result.status === 'paid';
  const intent = 'intent' in result ? result.intent : null;

  return (
    <div className="container-page flex max-w-lg flex-col items-center py-20 text-center">
      {paid ? (
        <CheckCircle2 className="h-14 w-14 text-emerald-500" />
      ) : result.status === 'failed' ? (
        <XCircle className="h-14 w-14 text-red-500" />
      ) : (
        <Clock className="h-14 w-14 text-gold-500" />
      )}

      <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900">
        {paid
          ? 'Payment received'
          : result.status === 'failed'
            ? 'Payment not completed'
            : 'Waiting for confirmation'}
      </h1>

      <p className="mt-2 max-w-sm text-sm text-ink-500">
        {paid
          ? intent?.kind === 'SUBSCRIPTION'
            ? 'Your Semester Pass is active — every paid material is unlocked.'
            : 'The material is unlocked on your account. A receipt has been emailed to you.'
          : result.status === 'failed'
            ? 'No money was taken. You can try again from the material page.'
            : 'We have not had confirmation from Paystack yet. If money left your account it will unlock automatically within a few minutes.'}
      </p>

      {intent && (
        <p className="mt-4 rounded-lg bg-ink-50 px-3 py-2 font-mono text-xs text-ink-500">
          {formatMoney(intent.amount.toString())} · {intent.reference}
        </p>
      )}

      <div className="mt-8 flex gap-2">
        {paid && intent?.kind === 'MATERIAL' && intent.materialId ? (
          <Link href={`/material/${intent.materialId}`} className="btn-primary">
            Download now
          </Link>
        ) : (
          <Link href="/browse" className="btn-primary">
            Browse materials
          </Link>
        )}
        <Link href="/dashboard" className="btn-outline">
          My dashboard
        </Link>
      </div>
    </div>
  );
}
