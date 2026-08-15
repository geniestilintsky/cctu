'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { deleteFile } from '@/lib/storage';
import { dispatch, renderEmail } from '@/lib/messaging';
import { UPLOAD_VERIFIED_POINTS } from '@/lib/config';
import { slugify } from '@/lib/utils';
import type { ActionState } from './material-actions';

/* ---------------------------------------------------------------- review queue */

export async function approveMaterial(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireRole('SUPER_ADMIN');
  const id = String(formData.get('materialId') || '');
  const paid = formData.get('paid') === 'on';
  const priceRaw = Number(formData.get('price'));

  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true, phone: true, role: true, indexNumber: true } },
      course: { select: { id: true, code: true, title: true } },
    },
  });
  if (!material) return { error: 'Material not found.' };

  if (paid && (!Number.isFinite(priceRaw) || priceRaw <= 0)) {
    return { error: 'Enter a price above zero, or approve it as free.' };
  }

  await prisma.material.update({
    where: { id },
    data: {
      status: 'APPROVED',
      isFree: !paid,
      price: paid ? priceRaw : null,
      reviewedById: admin.id,
      reviewedAt: new Date(),
      rejectionReason: null,
    },
  });

  // §5.5 — a verified student upload earns points.
  if (material.uploadedBy.role === 'STUDENT') {
    const already = await prisma.pointTransaction.findFirst({
      where: { materialId: id, source: 'UPLOAD_VERIFIED' },
    });
    if (!already) {
      await prisma.pointTransaction.create({
        data: {
          userId: material.uploadedById,
          source: 'UPLOAD_VERIFIED',
          courseId: material.courseId,
          materialId: material.id,
          points: UPLOAD_VERIFIED_POINTS,
          note: 'Upload verified by Super Admin',
          studentName: material.uploadedBy.name,
          indexNumber: material.uploadedBy.indexNumber,
        },
      });
    }
  }

  await dispatch(
    [{ name: material.uploadedBy.name, email: material.uploadedBy.email, phone: material.uploadedBy.phone }],
    {
      subject: `Approved: ${material.title}`,
      text: `Your upload "${material.title}" for ${material.course.code} is now live on CCTU StudyHub.`,
      html: renderEmail({
        heading: 'Your upload is live',
        body: `<p><strong>${material.title}</strong> for ${material.course.code} — ${material.course.title} has been approved and is now available to students.</p>${
          material.uploadedBy.role === 'STUDENT'
            ? `<p>You earned <strong>${UPLOAD_VERIFIED_POINTS} points</strong> for this upload.</p>`
            : ''
        }`,
        ctaLabel: 'View material',
        ctaUrl: `/material/${material.id}`,
      }),
    }
  );

  revalidatePath('/admin/review-queue');
  revalidatePath('/browse');
  return { ok: true, message: 'Approved and published.' };
}

export async function rejectMaterial(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireRole('SUPER_ADMIN');
  const id = String(formData.get('materialId') || '');
  const reason = String(formData.get('reason') || '').trim();
  if (!reason) return { error: 'Give the uploader a reason for the rejection.' };

  const material = await prisma.material.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
    include: {
      uploadedBy: { select: { name: true, email: true, phone: true } },
      course: { select: { code: true } },
    },
  });

  await dispatch(
    [{ name: material.uploadedBy.name, email: material.uploadedBy.email, phone: material.uploadedBy.phone }],
    {
      subject: `Not approved: ${material.title}`,
      text: `Your upload "${material.title}" was not approved. Reason: ${reason}`,
      html: renderEmail({
        heading: 'Your upload was not approved',
        body: `<p><strong>${material.title}</strong> (${material.course.code}) was reviewed and not published.</p><p><strong>Reason:</strong> ${reason}</p><p>You are welcome to fix the issue and upload again.</p>`,
        ctaLabel: 'Upload again',
        ctaUrl: '/upload',
      }),
    }
  );

  revalidatePath('/admin/review-queue');
  return { ok: true, message: 'Rejected and the uploader has been told why.' };
}

/* ------------------------------------------------------------------- pricing */

export async function setMaterialPrice(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole('SUPER_ADMIN');
  const id = String(formData.get('materialId') || '');
  const paid = formData.get('paid') === 'on';
  const price = Number(formData.get('price'));

  if (paid && (!Number.isFinite(price) || price <= 0)) {
    return { error: 'Enter a valid price.' };
  }

  await prisma.material.update({
    where: { id },
    data: { isFree: !paid, price: paid ? price : null },
  });

  revalidatePath('/admin/materials');
  revalidatePath(`/material/${id}`);
  return { ok: true, message: 'Price updated.' };
}

export async function deleteMaterial(formData: FormData) {
  await requireRole('SUPER_ADMIN');
  const id = String(formData.get('materialId') || '');
  const material = await prisma.material.findUnique({
    where: { id },
    select: { fileKey: true },
  });
  if (material) await deleteFile(material.fileKey);
  await prisma.material.delete({ where: { id } });
  revalidatePath('/admin/materials');
  revalidatePath('/browse');
}

/* ------------------------------------------------------------------ taxonomy */

const nameSchema = z.string().min(2).max(120);

export async function createFaculty(_prev: ActionState, formData: FormData) {
  await requireRole('SUPER_ADMIN');
  const name = nameSchema.safeParse(String(formData.get('name') || '').trim());
  if (!name.success) return { error: 'Enter a faculty name.' };
  const slug = slugify(name.data);
  const exists = await prisma.faculty.findUnique({ where: { slug } });
  if (exists) return { error: 'That faculty already exists.' };
  await prisma.faculty.create({ data: { name: name.data, slug } });
  revalidatePath('/admin/taxonomy');
  return { ok: true, message: 'Faculty added.' };
}

export async function createDepartment(_prev: ActionState, formData: FormData) {
  await requireRole('SUPER_ADMIN');
  const name = nameSchema.safeParse(String(formData.get('name') || '').trim());
  const facultyId = String(formData.get('facultyId') || '');
  if (!name.success || !facultyId) return { error: 'Choose a faculty and enter a name.' };
  const slug = slugify(name.data);
  if (await prisma.department.findUnique({ where: { slug } }))
    return { error: 'That department already exists.' };
  await prisma.department.create({ data: { name: name.data, slug, facultyId } });
  revalidatePath('/admin/taxonomy');
  return { ok: true, message: 'Department added.' };
}

export async function createCourse(_prev: ActionState, formData: FormData) {
  await requireRole('SUPER_ADMIN');
  const code = String(formData.get('code') || '').trim().toUpperCase();
  const title = String(formData.get('title') || '').trim();
  const departmentId = String(formData.get('departmentId') || '');
  const level = Number(formData.get('level') || 100);
  const lecturerId = String(formData.get('lecturerId') || '') || null;

  if (!code || !title || !departmentId) {
    return { error: 'Course code, title and department are all required.' };
  }
  const clash = await prisma.course.findFirst({ where: { code, departmentId } });
  if (clash) return { error: `${code} already exists in that department.` };

  await prisma.course.create({
    data: { code, title, departmentId, level, lecturerId },
  });
  revalidatePath('/admin/taxonomy');
  revalidatePath('/browse');
  return { ok: true, message: `${code} added.` };
}

export async function updateCourse(_prev: ActionState, formData: FormData) {
  await requireRole('SUPER_ADMIN');
  const id = String(formData.get('courseId') || '');
  const lecturerId = String(formData.get('lecturerId') || '') || null;
  const level = Number(formData.get('level') || 100);
  const title = String(formData.get('title') || '').trim();
  if (!id || !title) return { error: 'Missing course details.' };

  await prisma.course.update({
    where: { id },
    data: { lecturerId, level, title },
  });
  revalidatePath('/admin/taxonomy');
  return { ok: true, message: 'Course updated.' };
}

export async function deleteTaxonomyNode(formData: FormData) {
  await requireRole('SUPER_ADMIN');
  const kind = String(formData.get('kind') || '');
  const id = String(formData.get('id') || '');
  if (kind === 'faculty') await prisma.faculty.delete({ where: { id } });
  if (kind === 'department') await prisma.department.delete({ where: { id } });
  if (kind === 'course') await prisma.course.delete({ where: { id } });
  revalidatePath('/admin/taxonomy');
  revalidatePath('/browse');
}

/* --------------------------------------------------------------------- users */

export async function createLecturer(_prev: ActionState, formData: FormData) {
  const admin = await requireRole('SUPER_ADMIN');
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const phone = String(formData.get('phone') || '').trim() || null;
  const password = String(formData.get('password') || '');

  if (!name || !email) return { error: 'Name and email are required.' };
  if (password.length < 8) return { error: 'Set a temporary password of 8+ characters.' };
  if (await prisma.user.findUnique({ where: { email } }))
    return { error: 'A user with that email already exists.' };

  await prisma.user.create({
    data: {
      name,
      email,
      phone,
      role: 'LECTURER',
      addedById: admin.id,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  await dispatch([{ name, email, phone }], {
    subject: 'Your CCTU StudyHub lecturer account',
    text: `An account has been created for you. Sign in at ${process.env.NEXTAUTH_URL}/auth/sign-in with ${email} and the temporary password you were given.`,
    html: renderEmail({
      heading: 'Your lecturer account is ready',
      body: `<p>Hello ${name},</p><p>A lecturer account has been created for you on CCTU StudyHub. Sign in with <strong>${email}</strong> and the temporary password shared with you, then change it from your dashboard.</p><p>As a lecturer you can publish materials instantly, add up to 3 teaching assistants, post course announcements and review student point requests.</p>`,
      ctaLabel: 'Sign in',
      ctaUrl: '/auth/sign-in',
    }),
  });

  revalidatePath('/admin/users');
  return { ok: true, message: `${name} can now sign in as a lecturer.` };
}

export async function setUserActive(formData: FormData) {
  await requireRole('SUPER_ADMIN');
  const id = String(formData.get('userId') || '');
  const active = formData.get('active') === 'true';
  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath('/admin/users');
}

export async function resetUserPassword(_prev: ActionState, formData: FormData) {
  await requireRole('SUPER_ADMIN');
  const id = String(formData.get('userId') || '');
  const password = String(formData.get('password') || '');
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  revalidatePath('/admin/users');
  return { ok: true, message: 'Password reset.' };
}

/* ------------------------------------------------------------------- reports */

export async function resolveReport(_prev: ActionState, formData: FormData) {
  await requireRole('SUPER_ADMIN');
  const id = String(formData.get('reportId') || '');
  const decision = String(formData.get('decision') || '');
  const resolution = String(formData.get('resolution') || '').trim();
  const takedown = formData.get('takedown') === 'on';

  const report = await prisma.materialReport.update({
    where: { id },
    data: {
      status: decision === 'approve' ? 'APPROVED' : 'REJECTED',
      resolution: resolution || null,
    },
    include: { material: { select: { id: true } } },
  });

  if (takedown) {
    await prisma.material.update({
      where: { id: report.materialId },
      data: {
        status: 'REJECTED',
        rejectionReason: `Taken down after a content report: ${resolution || 'copyright/ownership claim'}`,
      },
    });
    revalidatePath('/browse');
  }

  revalidatePath('/admin/reports');
  return {
    ok: true,
    message: takedown ? 'Report upheld and material taken down.' : 'Report closed.',
  };
}

/* ---------------------------------------------------------------- affiliates */

export async function upsertAffiliateLink(_prev: ActionState, formData: FormData) {
  await requireRole('SUPER_ADMIN');
  const id = String(formData.get('id') || '');
  const label = String(formData.get('label') || '').trim();
  const targetUrl = String(formData.get('targetUrl') || '').trim();
  const description = String(formData.get('description') || '').trim() || null;
  const placement = String(formData.get('placement') || 'post-download');
  const active = formData.get('active') === 'on';

  if (!label || !targetUrl) return { error: 'Label and target URL are required.' };
  try {
    new URL(targetUrl);
  } catch {
    return { error: 'Enter a full URL, including https://' };
  }

  if (id) {
    await prisma.affiliateLink.update({
      where: { id },
      data: { label, targetUrl, description, placement, active },
    });
  } else {
    await prisma.affiliateLink.create({
      data: { label, targetUrl, description, placement, active },
    });
  }

  revalidatePath('/admin/affiliate-links');
  return { ok: true, message: id ? 'Link updated.' : 'Link added.' };
}

export async function deleteAffiliateLink(formData: FormData) {
  await requireRole('SUPER_ADMIN');
  await prisma.affiliateLink.delete({
    where: { id: String(formData.get('id') || '') },
  });
  revalidatePath('/admin/affiliate-links');
}
