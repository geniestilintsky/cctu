import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paystack';
import { fulfillPayment, failPayment } from '@/lib/fulfillment';

/**
 * Paystack webhook. Point your dashboard at
 *   https://<your-domain>/api/paystack/webhook
 * Successful charges create the Purchase or Subscription record and unlock
 * access; the redirect callback does the same check, so a dropped webhook
 * never leaves a paying student locked out.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 });
  }

  const reference = event.data?.reference;
  if (!reference) return NextResponse.json({ ok: true });

  switch (event.event) {
    case 'charge.success':
    case 'subscription.create':
    case 'invoice.payment_succeeded':
      await fulfillPayment(reference);
      break;
    case 'charge.failed':
    case 'invoice.payment_failed':
      await failPayment(reference);
      break;
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
