'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireUser, lecturerScopeId, isStaff, scopedCourseIds } from '@/lib/session';
import { logStaffAction } from '@/lib/activity';
import { dispatch, renderEmail } from '@/lib/messaging';
import { MAX_TAS_PER_LECTURER } from '@/lib/config';
import type { ActionState } from './material-actions';

async function requireStaff() {
  const user = await requireUser();
  if (!isStaff(user.role)) throw new Error('Lecturer or TA access required');
  return user;
}

/* ------------------------------------------------------------------ TA system */

/**
 * §5.4 — a lecturer may add up to 3 TA accounts. TAs get the same dashboard and
 * permissions, scoped to the lecturer's courses; everything they do is logged
 * and shown to the lecturer.
 */
export async function addTeachingAssistant(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireStaff();
  if (user.role !== 'LECTURER') {
    return { error: 'Only the lecturer can add teaching assistants.' };
  }

  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const phone = String(formData.get('phone') || '').trim() || null;
  const password = String(formData.get('password') || '');

  if (!name || !email) return { error: 'Name and email are required.' };
  if (password.length < 8) return { error: 'Set a temporary password of 8+ characters.' };

  const count = await prisma.user.count({
    where: { addedById: user.id, role: 'TA', active: true },
  });
  if (count >= MAX_TAS_PER_LECTURER) {
    return {
      error: `You already have ${MAX_TAS_PER_LECTURER} active teaching assistants. Remove one first.`,
    };
  }

  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: 'Someone with that email already has an account.' };
  }

  const ta = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      role: 'TA',
      addedById: user.id,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  await logStaffAction(user, 'TA_ADDED', `${user.name} added ${name} as a TA`, ta.id);

  await dispatch([{ name, email, phone }], {
    subject: 'You have been added as a teaching assistant',
    text: `${user.name} added you as a TA on CCTU StudyHub. Sign in with ${email} and the temporary password you were given.`,
    html: renderEmail({
      heading: `You are now a TA for ${user.name}`,
      body: `<p>Hello ${name},</p><p>${user.name} has added you as a teaching assistant on CCTU StudyHub. You can publish materials, post announcements and assign points for their courses.</p><p>Everything you do is shown on ${user.name}'s dashboard.</p><p>Sign in with <strong>${email}</strong> and the temporary password shared with you.</p>`,
      ctaLabel: 'Sign in',
      ctaUrl: '/auth/sign-in',
    }),
  });

  revalidatePath('/lecturer/team');
  return { ok: true, message: `${name} can now sign in as your TA.` };
}

export async function removeTeachingAssistant(formData: FormData) {
  const user = await requireStaff();
  if (user.role !== 'LECTURER') return;

  const taId = String(formData.get('taId') || '');
  const ta = await prisma.user.findFirst({
    where: { id: taId, addedById: user.id, role: 'TA' },
  });
  if (!ta) return;

  // Deactivate rather than delete so their uploads and activity log survive.
  await prisma.user.update({ where: { id: ta.id }, data: { active: false } });
  await logStaffAction(user, 'TA_REMOVED', `${user.name} removed ${ta.name} as a TA`, ta.id);

  revalidatePath('/lecturer/team');
}

export async function markActivitySeen() {
  const user = await requireStaff();
  await prisma.tAActivityLog.updateMany({
    where: { lecturerId: lecturerScopeId(user), seen: false },
    data: { seen: true },
  });
  revalidatePath('/lecturer/dashboard');
}

/* -------------------------------------------------------------- announcements */

/**
 * §5.3 — an announcement fans out to every active subscriber of the course
 * (and to students subscribed to the lecturer). Delivery goes through the
 * channel layer, so WhatsApp joins later without touching this model.
 */
export async function postAnnouncement(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireStaff();
  const courseId = String(formData.get('courseId') || '');
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();

  if (!courseId || !title || !body) {
    return { error: 'Choose a course and fill in both the title and the message.' };
  }

  const allowed = await scopedCourseIds(user);
  if (!allowed.includes(courseId)) {
    return { error: 'You can only post announcements for your own courses.' };
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { code: true, title: true, lecturerId: true },
  });
  if (!course) return { error: 'Course not found.' };

  const subs = await prisma.notificationSubscription.findMany({
    where: {
      active: true,
      OR: [
        { courseId },
        ...(course.lecturerId ? [{ lecturerId: course.lecturerId }] : []),
      ],
    },
    select: {
      student: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  // De-duplicate students subscribed to both the course and the lecturer.
  const recipients = Array.from(
    new Map(subs.map((s) => [s.student.id, s.student])).values()
  );

  const announcement = await prisma.announcement.create({
    data: { authorId: user.id, courseId, title, body, recipients: recipients.length },
  });

  const { delivered } = await dispatch(recipients, {
    subject: `${course.code}: ${title}`,
    text: `${body}\n\n— ${user.name}, ${course.code} ${course.title}`,
    html: renderEmail({
      heading: title,
      body: `<p style="white-space:pre-line">${body}</p><p style="margin-top:20px;color:#6B7688">— ${user.name}, ${course.code} ${course.title}</p>`,
      ctaLabel: 'Open the course',
      ctaUrl: `/browse?course=${courseId}`,
      footnote: 'You are receiving this because you subscribed to this course on CCTU StudyHub.',
    }),
  });

  await prisma.announcement.update({
    where: { id: announcement.id },
    data: { sentViaEmail: delivered > 0 },
  });

  await logStaffAction(
    user,
    'ANNOUNCEMENT',
    `${user.name} posted “${title}” to ${course.code} (${recipients.length} subscribers)`,
    announcement.id
  );

  revalidatePath('/lecturer/announcements');
  return {
    ok: true,
    message: `Posted to ${course.code}. ${delivered} of ${recipients.length} subscriber(s) notified.`,
  };
}

/* ---------------------------------------------------------------- points/boost */

/**
 * §5.5 — after a student buys a paid material for one of their courses, a
 * lecturer or TA *may* award purchase points. Nothing is automatic.
 */
export async function assignPurchasePoints(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireStaff();
  const purchaseId = String(formData.get('purchaseId') || '');
  const points = Number(formData.get('points') || 0);
  const indexNumber = String(formData.get('indexNumber') || '').trim() || null;

  if (!Number.isInteger(points) || points <= 0 || points > 50) {
    return { error: 'Award between 1 and 50 points.' };
  }

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, indexNumber: true } },
      material: { select: { id: true, title: true, courseId: true, course: { select: { code: true } } } },
    },
  });
  if (!purchase) return { error: 'Purchase not found.' };

  const allowed = await scopedCourseIds(user);
  if (!allowed.includes(purchase.material.courseId)) {
    return { error: 'That purchase is not for one of your courses.' };
  }

  const already = await prisma.pointTransaction.findFirst({
    where: {
      userId: purchase.userId,
      materialId: purchase.materialId,
      source: 'PURCHASE_AWARDED',
    },
  });
  if (already) return { error: 'Points were already awarded for this purchase.' };

  await prisma.pointTransaction.create({
    data: {
      userId: purchase.userId,
      source: 'PURCHASE_AWARDED',
      courseId: purchase.material.courseId,
      materialId: purchase.materialId,
      points,
      note: `Purchase of “${purchase.material.title}”`,
      studentName: purchase.user.name,
      indexNumber: indexNumber ?? purchase.user.indexNumber,
      awardedById: user.id,
    },
  });

  await logStaffAction(
    user,
    'POINTS_ASSIGNED',
    `${user.name} awarded ${points} points to ${purchase.user.name} (${purchase.material.course.code})`,
    purchase.id
  );

  await dispatch(
    [{ name: purchase.user.name, email: purchase.user.email, phone: purchase.user.phone }],
    {
      subject: `You earned ${points} points`,
      text: `${user.name} awarded you ${points} points for ${purchase.material.course.code}.`,
      html: renderEmail({
        heading: `You earned ${points} points`,
        body: `<p>${user.name} awarded you <strong>${points} points</strong> for your purchase in ${purchase.material.course.code}.</p><p>You can request that your lecturer consider these points from your dashboard. Any grade decision remains entirely theirs.</p>`,
        ctaLabel: 'View my points',
        ctaUrl: '/dashboard/points',
      }),
    }
  );

  revalidatePath('/lecturer/points');
  return { ok: true, message: `${points} points awarded to ${purchase.user.name}.` };
}

/**
 * §5.5 — the lecturer approves or rejects each boost request individually.
 * Approving writes a negative ledger entry (points are spent) and records the
 * decision. It never touches a grade.
 */
export async function decideBoostRequest(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireStaff();
  const requestId = String(formData.get('requestId') || '');
  const decision = String(formData.get('decision') || '');
  const note = String(formData.get('note') || '').trim() || null;

  const request = await prisma.boostRequest.findUnique({
    where: { id: requestId },
    include: {
      student: { select: { id: true, name: true, email: true, phone: true } },
      course: { select: { id: true, code: true, title: true } },
    },
  });
  if (!request) return { error: 'Request not found.' };
  if (request.status !== 'PENDING') return { error: 'That request was already decided.' };

  const allowed = await scopedCourseIds(user);
  if (!allowed.includes(request.courseId)) {
    return { error: 'That request belongs to another lecturer’s course.' };
  }

  if (decision === 'approve') {
    const ledger = await prisma.pointTransaction.create({
      data: {
        userId: request.studentId,
        source: 'BOOST_REDEEMED',
        courseId: request.courseId,
        points: -request.pointsUsed,
        note: `Boost request approved for ${request.course.code}`,
        awardedById: user.id,
      },
    });
    await prisma.boostRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        decidedById: user.id,
        decidedAt: new Date(),
        decisionNote: note,
        ledgerId: ledger.id,
      },
    });
  } else {
    await prisma.boostRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        decidedById: user.id,
        decidedAt: new Date(),
        decisionNote: note,
      },
    });
  }

  await logStaffAction(
    user,
    'BOOST_DECISION',
    `${user.name} ${decision === 'approve' ? 'approved' : 'rejected'} a ${request.pointsUsed}-point request from ${request.student.name} (${request.course.code})`,
    requestId
  );

  await dispatch(
    [{ name: request.student.name, email: request.student.email, phone: request.student.phone }],
    {
      subject: `Your ${request.course.code} points request was ${decision === 'approve' ? 'approved' : 'not approved'}`,
      text: `${user.name} ${decision === 'approve' ? 'approved' : 'did not approve'} your ${request.pointsUsed}-point request for ${request.course.code}.${note ? ` Note: ${note}` : ''}`,
      html: renderEmail({
        heading:
          decision === 'approve'
            ? 'Your points request was approved'
            : 'Your points request was not approved',
        body: `<p>${user.name} reviewed your request to apply <strong>${request.pointsUsed} points</strong> to ${request.course.code} — ${request.course.title}.</p>${
          note ? `<p><strong>Note from your lecturer:</strong> ${note}</p>` : ''
        }<p style="color:#6B7688;font-size:13px">Any effect on your grade is decided and applied by your lecturer under the university's academic policy. StudyHub only records the request and the decision.</p>`,
        ctaLabel: 'View my points',
        ctaUrl: '/dashboard/points',
      }),
    }
  );

  revalidatePath('/lecturer/boost-requests');
  return {
    ok: true,
    message: decision === 'approve' ? 'Request approved.' : 'Request rejected.',
  };
}
