'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { hasActiveSubscription } from '@/lib/access';
import { initializeTransaction, newReference, verifyTransaction } from '@/lib/paystack';
import { fulfillPayment, failPayment } from '@/lib/fulfillment';
import { SEMESTER_PASS } from '@/lib/config';

/** Start a one-time material purchase. Redirects to Paystack (or the sandbox). */
export async function startMaterialCheckout(formData: FormData) {
  const user = await requireUser();
  const materialId = String(formData.get('materialId') || '');

  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: { id: true, title: true, price: true, isFree: true },
  });
  if (!material || material.isFree) redirect(`/material/${materialId}`);

  const owned = await prisma.purchase.findFirst({
    where: { userId: user.id, materialId },
  });
  if (owned) redirect(`/material/${materialId}`);

  const reference = newReference('mat');
  const amount = Number(material.price);

  await prisma.paymentIntent.create({
    data: {
      reference,
      userId: user.id,
      kind: 'MATERIAL',
      materialId: material.id,
      amount,
    },
  });

  const { authorizationUrl } = await initializeTransaction({
    email: user.email,
    amount,
    reference,
    callbackUrl: `${process.env.NEXTAUTH_URL}/checkout/callback`,
    metadata: { materialId: material.id, userId: user.id, title: material.title },
  });

  redirect(authorizationUrl);
}

/** Start a Semester Pass subscription. */
export async function startSubscriptionCheckout() {
  const user = await requireUser();

  const active = await hasActiveSubscription(user.id);
  if (active) redirect('/dashboard');

  const reference = newReference('sub');

  await prisma.paymentIntent.create({
    data: {
      reference,
      userId: user.id,
      kind: 'SUBSCRIPTION',
      plan: SEMESTER_PASS.plan,
      amount: SEMESTER_PASS.price,
    },
  });

  const { authorizationUrl } = await initializeTransaction({
    email: user.email,
    amount: SEMESTER_PASS.price,
    reference,
    callbackUrl: `${process.env.NEXTAUTH_URL}/checkout/callback`,
    metadata: { plan: SEMESTER_PASS.plan, userId: user.id },
  });

  redirect(authorizationUrl);
}

/**
 * Sandbox resolver — only reachable when no Paystack key is configured. It
 * exercises exactly the same fulfilment path as the live webhook.
 */
export async function resolveSandboxPayment(formData: FormData) {
  await requireUser();
  const reference = String(formData.get('reference') || '');
  const outcome = String(formData.get('outcome') || 'success');

  if (outcome === 'success') {
    await fulfillPayment(reference);
  } else {
    await failPayment(reference);
  }

  revalidatePath('/dashboard');
  redirect(`/checkout/callback?reference=${encodeURIComponent(reference)}`);
}

/** Used by the redirect callback page to confirm before showing a result. */
export async function confirmPayment(reference: string) {
  const intent = await prisma.paymentIntent.findUnique({ where: { reference } });
  if (!intent) return { status: 'unknown' as const };
  if (intent.status === 'PAID') return { status: 'paid' as const, intent };

  const result = await verifyTransaction(reference).catch(() => null);
  if (result?.status === 'success') {
    await fulfillPayment(reference);
    return { status: 'paid' as const, intent };
  }
  return { status: intent.status === 'FAILED' ? ('failed' as const) : ('pending' as const), intent };
}
