import { prisma } from '@/lib/prisma';
import { plain } from '@/lib/utils';
import { PageHeader, Stat } from '@/components/ui/primitives';
import TaxonomyManager, {
  TaxonomyFaculty,
} from '@/components/admin/taxonomy-manager';

export const metadata = { title: 'Faculties & courses' };
export const dynamic = 'force-dynamic';

export default async function TaxonomyPage() {
  const [faculties, lecturers, courseCount, materialCount] = await Promise.all([
    prisma.faculty.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        departments: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            courses: {
              orderBy: { code: 'asc' },
              select: {
                id: true,
                code: true,
                title: true,
                level: true,
                lecturerId: true,
                _count: { select: { materials: true } },
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: 'LECTURER', active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.course.count(),
    prisma.material.count(),
  ]);

  const deptCount = faculties.reduce((n, f) => n + f.departments.length, 0);

  return (
    <div>
      <PageHeader
        title="Faculties, departments & courses"
        description="The structure students browse. Assign each course a primary lecturer so uploads, announcements and boost requests route correctly."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Faculties" value={faculties.length} accent="brand" />
        <Stat label="Departments" value={deptCount} accent="gold" />
        <Stat label="Courses" value={courseCount} accent="emerald" />
        <Stat label="Materials" value={materialCount} accent="ink" />
      </div>

      <TaxonomyManager
        faculties={plain(faculties) as TaxonomyFaculty[]}
        lecturers={plain(lecturers)}
      />
    </div>
  );
}
