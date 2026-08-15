import { prisma } from './prisma';
import { lecturerScopeId } from './session';
import type { User } from '@prisma/client';

export type StaffAction =
  | 'UPLOAD'
  | 'ANNOUNCEMENT'
  | 'POINTS_ASSIGNED'
  | 'BOOST_DECISION'
  | 'TA_ADDED'
  | 'TA_REMOVED';

/**
 * Record a lecturer/TA action against the owning lecturer.
 *
 * §5.4: "Every TA action is logged and surfaced as a notification on the
 * lecturer's dashboard — lecturers always see what's happened under their name."
 * Lecturer actions are logged too (already seen), so the log doubles as an
 * audit trail for the whole course team.
 */
export async function logStaffAction(
  actor: Pick<User, 'id' | 'role' | 'addedById'>,
  action: StaffAction,
  summary: string,
  entityId?: string
) {
  const lecturerId = lecturerScopeId(actor);
  return prisma.tAActivityLog.create({
    data: {
      actorId: actor.id,
      lecturerId,
      action,
      summary,
      entityId,
      // A lecturer's own action needs no notification badge.
      seen: actor.role !== 'TA',
    },
  });
}
