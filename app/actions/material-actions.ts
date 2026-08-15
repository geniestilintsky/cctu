'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

/** §5.7 — "Report content" flag on every material, visible to the Super Admin. */
const reportSchema = z.object({
  materialId: z.string().min(1),
  reason: z.string().min(1),
  details: z.string().max(2000).optional(),
  contact: z.string().max(160).optional(),
});

export type ActionState = { ok?: boolean; error?: string; message?: string };

export async function reportMaterial(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = reportSchema.safeParse({
    materialId: formData.get('materialId'),
    reason: formData.get('reason'),
    details: formData.get('details') || undefined,
    contact: formData.get('contact') || undefined,
  });

  if (!parsed.success) return { error: 'Please choose a reason for the report.' };

  const user = await getSessionUser();

  await prisma.materialReport.create({
    data: {
      materialId: parsed.data.materialId,
      reporterId: user?.id ?? null,
      reason: parsed.data.reason,
      details: parsed.data.details ?? null,
      contact: parsed.data.contact ?? user?.email ?? null,
    },
  });

  revalidatePath('/admin/reports');
  return {
    ok: true,
    message:
      'Thank you — the report has been sent to the platform administrator for review.',
  };
}

/** Affiliate click tracking (§5.6). Fire-and-forget from the client. */
export async function trackAffiliateClick(linkId: string) {
  await prisma.affiliateLink.update({
    where: { id: linkId },
    data: { clicks: { increment: 1 } },
  });
}
