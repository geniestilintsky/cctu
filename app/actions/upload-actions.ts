'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isStaff } from '@/lib/session';
import { putFile, checkUpload, ALLOWED_MIME, MAX_UPLOAD_BYTES } from '@/lib/storage';
import { logStaffAction } from '@/lib/activity';
import type { ActionState } from './material-actions';

const schema = z.object({
  title: z.string().min(4, 'Give the material a clear title').max(200),
  description: z.string().max(1000).optional(),
  courseId: z.string().min(1, 'Choose the course this belongs to'),
  type: z.enum(['PAST_EXAM', 'QUIZ', 'HANDOUT', 'TUTORIAL', 'BOOK', 'THESIS']),
  lecturerName: z.string().max(120).optional(),
  academicYear: z.string().max(20).optional(),
  semester: z.string().max(40).optional(),
});

/**
 * One upload entry point for every role (§5.2):
 *  - Lecturer / TA  → APPROVED + autoPublished, live immediately.
 *  - Student        → PENDING, lands in the Super Admin review queue.
 * Students never set a price; the Super Admin prices student uploads on approval.
 */
export async function uploadMaterial(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: 'Please sign in to upload.' };

  const parsed = schema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    courseId: formData.get('courseId'),
    type: formData.get('type'),
    lecturerName: formData.get('lecturerName') || undefined,
    academicYear: formData.get('academicYear') || undefined,
    semester: formData.get('semester') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Attach the document you want to upload.' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: 'That file is larger than the 25 MB limit.' };
  }
  // A declared MIME type is a hint from the browser, so it is checked only when
  // present. The authority is the file's own leading bytes, below.
  if (file.type && !ALLOWED_MIME.includes(file.type)) {
    return { error: 'Upload a PDF, Word, PowerPoint, image or zip file.' };
  }

  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const verdict = checkUpload(file.name, header);
  if (!verdict.ok) return { error: verdict.error };

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true, code: true, lecturerId: true },
  });
  if (!course) return { error: 'That course no longer exists.' };

  const staff = isStaff(user.role) || user.role === 'SUPER_ADMIN';

  // Pricing is a staff decision only.
  let isFree = true;
  let price: number | null = null;
  if (staff && formData.get('paid') === 'on') {
    const value = Number(formData.get('price'));
    if (!Number.isFinite(value) || value <= 0) {
      return { error: 'Enter a valid price, or leave the material free.' };
    }
    isFree = false;
    price = value;
  }

  // §5.2 — basic duplicate detection keeps the review queue clean.
  const duplicate = await prisma.material.findFirst({
    where: {
      courseId: course.id,
      type: parsed.data.type,
      fileName: file.name,
      status: { in: ['PENDING', 'APPROVED'] },
    },
    select: { id: true },
  });
  if (duplicate) {
    return {
      error:
        'A file with the same name already exists for this course and material type.',
    };
  }

  const stored = await putFile(file);

  const material = await prisma.material.create({
    data: {
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      type: parsed.data.type,
      courseId: course.id,
      uploadedById: user.id,
      lecturerName: parsed.data.lecturerName?.trim() || null,
      academicYear: parsed.data.academicYear || null,
      semester: parsed.data.semester || null,
      isFree,
      price,
      fileUrl: stored.url,
      fileKey: stored.key,
      fileName: stored.fileName,
      fileSize: stored.size,
      mimeType: stored.mimeType,
      status: staff ? 'APPROVED' : 'PENDING',
      autoPublished: staff,
      reviewedAt: staff ? new Date() : null,
    },
  });

  if (isStaff(user.role)) {
    await logStaffAction(
      user,
      'UPLOAD',
      `${user.name} published “${material.title}” to ${course.code}`,
      material.id
    );
  }

  revalidatePath('/browse');
  revalidatePath('/dashboard');
  revalidatePath('/lecturer/dashboard');
  revalidatePath('/admin/review-queue');

  return {
    ok: true,
    message: staff
      ? 'Published. Your material is live on the course page now.'
      : 'Submitted for review. You will be notified once an administrator approves it.',
  };
}
