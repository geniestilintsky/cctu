import { prisma } from './prisma';
import { SEMESTER_PASS } from './config';
import { dispatch, renderEmail } from './messaging';

/**
 * Turns a paid reference into access. Called from the Paystack webhook, from
 * the redirect callback (belt and braces — whichever lands first wins) and
 * from the offline sandbox resolver. Idempotent by reference.
 */
export async function fulfillPayment(reference: string) {
  const intent = await prisma.paymentIntent.findUnique({
    where: { reference },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      material: { select: { id: true, title: true, course: { select: { code: true } } } },
    },
  });

  if (!intent) return { ok: false, reason: 'unknown-reference' as const };
  if (intent.status === 'PAID') return { ok: true, alreadyDone: true, intent };

  if (intent.kind === 'MATERIAL' && intent.materialId) {
    const existing = await prisma.purchase.findFirst({
      where: { userId: intent.userId, materialId: intent.materialId },
    });
    if (!existing) {
      await prisma.purchase.create({
        data: {
          userId: intent.userId,
          materialId: intent.materialId,
          amount: intent.amount,
          paystackRef: reference,
        },
      });
    }
  }

  if (intent.kind === 'SUBSCRIPTION') {
    const expiresAt = new Date(
      Date.now() + SEMESTER_PASS.days * 24 * 60 * 60 * 1000
    );
    // Expire any older pass so the dashboard shows exactly one active plan.
    await prisma.subscription.updateMany({
      where: { userId: intent.userId, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });
    await prisma.subscription.create({
      data: {
        userId: intent.userId,
        plan: intent.plan || SEMESTER_PASS.plan,
        amount: intent.amount,
        paystackRef: reference,
        expiresAt,
        status: 'ACTIVE',
      },
    });
  }

  await prisma.paymentIntent.update({
    where: { id: intent.id },
    data: { status: 'PAID', settledAt: new Date() },
  });

  await dispatch(
    [{ name: intent.user.name, email: intent.user.email, phone: intent.user.phone }],
    {
      subject:
        intent.kind === 'MATERIAL'
          ? `Receipt — ${intent.material?.title ?? 'material unlocked'}`
          : `Receipt — ${SEMESTER_PASS.plan}`,
      text:
        intent.kind === 'MATERIAL'
          ? `Payment received (GHS ${intent.amount}). "${intent.material?.title}" is now unlocked. Reference: ${reference}`
          : `Payment received (GHS ${intent.amount}). Your ${SEMESTER_PASS.plan} is active for ${SEMESTER_PASS.days} days. Reference: ${reference}`,
      html: renderEmail({
        heading: 'Payment received',
        body:
          intent.kind === 'MATERIAL'
            ? `<p><strong>${intent.material?.title}</strong> (${intent.material?.course.code}) is now unlocked on your account.</p><p>Amount: GHS ${intent.amount}<br/>Reference: ${reference}</p>`
            : `<p>Your <strong>${SEMESTER_PASS.plan}</strong> is active for the next ${SEMESTER_PASS.days} days — every paid material is unlocked.</p><p>Amount: GHS ${intent.amount}<br/>Reference: ${reference}</p>`,
        ctaLabel:
          intent.kind === 'MATERIAL' && intent.material
            ? 'Download now'
            : 'Browse materials',
        ctaUrl:
          intent.kind === 'MATERIAL' && intent.material
            ? `/material/${intent.material.id}`
            : '/browse',
      }),
    }
  );

  return { ok: true, intent };
}

export async function failPayment(reference: string) {
  await prisma.paymentIntent
    .update({ where: { reference }, data: { status: 'FAILED' } })
    .catch(() => null);
}
