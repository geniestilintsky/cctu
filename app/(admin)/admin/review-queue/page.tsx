import { Inbox } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { plain } from '@/lib/utils';
import { PageHeader, EmptyState, Stat } from '@/components/ui/primitives';
import ReviewCard, { ReviewItem } from '@/components/admin/review-card';

export const metadata = { title: 'Review queue' };
export const dynamic = 'force-dynamic';

export default async function ReviewQueuePage() {
  const [pending, approvedCount, rejectedCount, todayCount] = await Promise.all([
    prisma.material.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        uploadedBy: { select: { name: true, email: true, indexNumber: true } },
        course: {
          select: { code: true, title: true, department: { select: { name: true } } },
        },
      },
    }),
    prisma.material.count({ where: { status: 'APPROVED' } }),
    prisma.material.count({ where: { status: 'REJECTED' } }),
    prisma.material.count({
      where: {
        reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Review queue"
        description="Student uploads wait here. Lecturer and TA uploads publish automatically and never appear in this list."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Waiting" value={pending.length} accent="gold" />
        <Stat label="Reviewed today" value={todayCount} accent="brand" />
        <Stat label="Published" value={approvedCount} accent="emerald" />
        <Stat label="Rejected" value={rejectedCount} accent="ink" />
      </div>

      {pending.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-10 w-10" />}
          title="Queue is clear"
          description="Every student upload has been reviewed. New submissions will appear here."
        />
      ) : (
        <div className="space-y-4">
          {pending.map((item) => (
            <ReviewCard key={item.id} item={plain(item) as unknown as ReviewItem} />
          ))}
        </div>
      )}
    </div>
  );
}
