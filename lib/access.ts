import { prisma } from './prisma';
import type { Material, User } from '@prisma/client';

export type AccessResult = {
  canDownload: boolean;
  reason: 'FREE' | 'PURCHASED' | 'SUBSCRIPTION' | 'STAFF' | 'LOGIN_REQUIRED' | 'PAYMENT_REQUIRED';
};

export async function hasActiveSubscription(userId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: 'ACTIVE', expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'desc' },
  });
  return sub;
}

/**
 * §5.1 Access rules:
 *  - Free materials: anyone, no login.
 *  - Paid materials: must be logged in, then unlocked by a one-time purchase
 *    or an active subscription.
 */
export async function checkMaterialAccess(
  material: Pick<Material, 'id' | 'isFree' | 'uploadedById'>,
  user: Pick<User, 'id' | 'role'> | null
): Promise<AccessResult> {
  if (material.isFree) return { canDownload: true, reason: 'FREE' };
  if (!user) return { canDownload: false, reason: 'LOGIN_REQUIRED' };

  if (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'LECTURER' ||
    user.role === 'TA' ||
    material.uploadedById === user.id
  ) {
    return { canDownload: true, reason: 'STAFF' };
  }

  const purchase = await prisma.purchase.findFirst({
    where: { userId: user.id, materialId: material.id },
  });
  if (purchase) return { canDownload: true, reason: 'PURCHASED' };

  const sub = await hasActiveSubscription(user.id);
  if (sub) return { canDownload: true, reason: 'SUBSCRIPTION' };

  return { canDownload: false, reason: 'PAYMENT_REQUIRED' };
}
