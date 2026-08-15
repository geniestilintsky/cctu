'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { spendablePoints } from '@/lib/points';
import { dispatch, renderEmail } from '@/lib/messaging';
import type { ActionState } from './material-actions';

/* --------------------------------------------------------- notification subs */

/**
 * §5.3 — students subscribe/unsubscribe to a course or a lecturer at any time.
 * A phone number and/or email must be on file, which is enforced here rather
 * than at sign-up so browsing is never blocked.
 */
export async function toggleSubscription(formData: FormData) {
  const user = await requireUser();
  const courseId = String(formData.get('courseId') || '') || null;
  const lecturerId = String(formData.get('lecturerId') || '') || null;
  if (!courseId && !lecturerId) return;

  const existing = await prisma.notificationSubscription.findFirst({
    where: { studentId: user.id, courseId, lecturerId },
  });

  if (existing) {
    await prisma.notificationSubscription.update({
      where: { id: existing.id },
      data: { active: !existing.active },
    });
  } else {
    await prisma.notificationSubscription.create({
      data: { studentId: user.id, courseId, lecturerId, active: true },
    });
  }

  revalidatePath('/dashboard/notifications');
}

export async function updateProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const name = String(formData.get('name') || '').trim();
  const phone = String(formData.get('phone') || '').trim() || null;
  const indexNumber = String(formData.get('indexNumber') || '').trim() || null;

  if (name.length < 2) return { error: 'Enter your full name.' };

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone, indexNumber },
  });

  revalidatePath('/dashboard/notifications');
  return { ok: true, message: 'Profile updated.' };
}

/* ------------------------------------------------------------ boost requests */

/**
 * §5.5 — a student commits points against one course. The course's lecturer
 * decides. Points stay in the ledger until the lecturer approves, but pending
 * requests are subtracted from the spendable balance so they cannot be
 * double-committed.
 */
export async function submitBoostRequest(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== 'STUDENT') return { error: 'Only students can request a boost.' };

  const courseId = String(formData.get('courseId') || '');
  const points = Number(formData.get('points') || 0);
  const message = String(formData.get('message') || '').trim() || null;
  const indexNumber = String(formData.get('indexNumber') || '').trim() || user.indexNumber;

  if (!courseId) return { error: 'Choose the course this request is for.' };
  if (!Number.isInteger(points) || points <= 0) {
    return { error: 'Enter how many points you want to use.' };
  }
  if (!indexNumber) {
    return {
      error:
        'Add your index number before requesting a boost — your lecturer needs it to identify you.',
    };
  }

  const available = await spendablePoints(user.id);
  if (points > available) {
    return { error: `You only have ${available} points available to commit.` };
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      code: true,
      title: true,
      lecturer: { select: { name: true, email: true, phone: true } },
    },
  });
  if (!course) return { error: 'Course not found.' };
  if (!course.lecturer) {
    return {
      error:
        'That course has no lecturer assigned yet, so there is nobody to review the request.',
    };
  }

  const duplicate = await prisma.boostRequest.findFirst({
    where: { studentId: user.id, courseId, status: 'PENDING' },
  });
  if (duplicate) {
    return { error: 'You already have a pending request for this course.' };
  }

  if (indexNumber !== user.indexNumber) {
    await prisma.user.update({ where: { id: user.id }, data: { indexNumber } });
  }

  await prisma.boostRequest.create({
    data: { studentId: user.id, courseId, pointsUsed: points, message, indexNumber },
  });

  await dispatch(
    [
      {
        name: course.lecturer.name,
        email: course.lecturer.email,
        phone: course.lecturer.phone,
      },
    ],
    {
      subject: `${course.code}: points request from ${user.name}`,
      text: `${user.name} (${indexNumber}) has asked you to consider ${points} points for ${course.code}.`,
      html: renderEmail({
        heading: 'New points request',
        body: `<p><strong>${user.name}</strong> (index ${indexNumber}) has asked you to consider <strong>${points} points</strong> for ${course.code} — ${course.title}.</p>${
          message ? `<p>“${message}”</p>` : ''
        }<p>Approve or reject it from your dashboard. Nothing is applied to any grade automatically.</p>`,
        ctaLabel: 'Review the request',
        ctaUrl: '/lecturer/boost-requests',
      }),
    }
  );

  revalidatePath('/dashboard/points');
  return {
    ok: true,
    message: `Sent to ${course.lecturer.name}. You will be notified of the decision.`,
  };
}

export async function cancelBoostRequest(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get('requestId') || '');
  await prisma.boostRequest.deleteMany({
    where: { id, studentId: user.id, status: 'PENDING' },
  });
  revalidatePath('/dashboard/points');
}
