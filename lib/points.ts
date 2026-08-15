import { prisma } from './prisma';

/**
 * Points ledger. Earned points are positive rows; a redeemed boost writes a
 * negative row (BOOST_REDEEMED) at approval time, so the balance is always the
 * sum of the ledger and nothing can be spent twice.
 *
 * Nothing here touches grades — §5.5: the platform tracks requests and lecturer
 * decisions only.
 */
export async function pointsBalance(userId: string) {
  const agg = await prisma.pointTransaction.aggregate({
    where: { userId },
    _sum: { points: true },
  });
  return agg._sum.points ?? 0;
}

export async function pointsPendingInRequests(userId: string) {
  const agg = await prisma.boostRequest.aggregate({
    where: { studentId: userId, status: 'PENDING' },
    _sum: { pointsUsed: true },
  });
  return agg._sum.pointsUsed ?? 0;
}

/** Points a student can still commit to a new boost request. */
export async function spendablePoints(userId: string) {
  const [balance, pending] = await Promise.all([
    pointsBalance(userId),
    pointsPendingInRequests(userId),
  ]);
  return Math.max(0, balance - pending);
}

export async function pointsByCourse(userId: string) {
  const rows = await prisma.pointTransaction.groupBy({
    by: ['courseId'],
    where: { userId, courseId: { not: null } },
    _sum: { points: true },
  });
  return rows.map((r) => ({ courseId: r.courseId!, points: r._sum.points ?? 0 }));
}
