import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './auth';
import { prisma } from './prisma';
import type { Role, User } from '@prisma/client';

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.active) return null;
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect('/auth/sign-in');
  return user;
}

export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect('/denied');
  return user;
}

/**
 * A TA acts entirely inside their lecturer's scope: same courses, same
 * permissions. Everything a TA does is attributed to them but rolled up to
 * the owning lecturer's dashboard.
 */
export function lecturerScopeId(user: Pick<User, 'id' | 'role' | 'addedById'>) {
  return user.role === 'TA' ? user.addedById ?? user.id : user.id;
}

export function isStaff(role: Role) {
  return role === 'LECTURER' || role === 'TA';
}

/** Courses this lecturer/TA is responsible for. */
export async function scopedCourseIds(
  user: Pick<User, 'id' | 'role' | 'addedById'>
) {
  const ownerId = lecturerScopeId(user);
  const courses = await prisma.course.findMany({
    where: { lecturerId: ownerId },
    select: { id: true },
  });
  return courses.map((c) => c.id);
}
