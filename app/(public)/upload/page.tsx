import { prisma } from '@/lib/prisma';
import { requireUser, isStaff, lecturerScopeId } from '@/lib/session';
import { PageHeader, Callout } from '@/components/ui/primitives';
import UploadForm, { CourseOption } from '@/components/upload/upload-form';
import { UPLOAD_VERIFIED_POINTS } from '@/lib/config';

export const metadata = { title: 'Upload material' };
export const dynamic = 'force-dynamic';

export default async function UploadPage() {
  const user = await requireUser();
  const staff = isStaff(user.role) || user.role === 'SUPER_ADMIN';

  // Lecturers and TAs are shown their own courses first; everyone can still
  // file a material against any course in the catalogue.
  const ownerId = lecturerScopeId(user);
  const courses = await prisma.course.findMany({
    orderBy: [{ department: { name: 'asc' } }, { code: 'asc' }],
    select: {
      id: true,
      code: true,
      title: true,
      lecturerId: true,
      department: { select: { name: true } },
    },
  });

  const options: CourseOption[] = courses
    .map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      department:
        isStaff(user.role) && c.lecturerId === ownerId
          ? 'My courses'
          : c.department.name,
    }))
    .sort((a, b) =>
      a.department === 'My courses' && b.department !== 'My courses' ? -1 : 0
    );

  let lecturerName: string | undefined;
  if (user.role === 'LECTURER') lecturerName = user.name;
  if (user.role === 'TA' && user.addedById) {
    const lecturer = await prisma.user.findUnique({
      where: { id: user.addedById },
      select: { name: true },
    });
    lecturerName = lecturer?.name;
  }

  return (
    <div className="container-page max-w-3xl py-10">
      <PageHeader
        title="Upload a material"
        description={
          staff
            ? 'Lecturer and TA uploads publish immediately and are tagged to the course.'
            : 'Share a past paper, handout or tutorial with your coursemates.'
        }
      />

      {!staff && (
        <div className="mb-6">
          <Callout tone="info" title="What happens next">
            Your upload goes into the review queue. Once an administrator approves
            it, it appears on the course page and you earn{' '}
            <strong>{UPLOAD_VERIFIED_POINTS} points</strong> — which you can later
            ask your lecturer to consider for a grade boost. Do not upload material
            you do not have the right to share.
          </Callout>
        </div>
      )}

      <UploadForm
        courses={options}
        canPrice={staff}
        defaultLecturerName={lecturerName}
      />
    </div>
  );
}
