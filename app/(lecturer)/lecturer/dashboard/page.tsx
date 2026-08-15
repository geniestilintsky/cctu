import Link from 'next/link';
import {
  Activity,
  BookOpen,
  Megaphone,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireRole, lecturerScopeId, scopedCourseIds } from '@/lib/session';
import { markActivitySeen } from '@/app/actions/lecturer-actions';
import { relativeTime, formatDate, firstName } from '@/lib/utils';
import { MAX_TAS_PER_LECTURER } from '@/lib/config';
import { PageHeader, Stat, EmptyState, Callout } from '@/components/ui/primitives';

export const metadata = { title: 'Lecturer dashboard' };
export const dynamic = 'force-dynamic';

const ACTION_LABEL: Record<string, string> = {
  UPLOAD: 'Upload',
  ANNOUNCEMENT: 'Announcement',
  POINTS_ASSIGNED: 'Points',
  BOOST_DECISION: 'Boost decision',
  TA_ADDED: 'TA added',
  TA_REMOVED: 'TA removed',
};

export default async function LecturerDashboard() {
  const user = await requireRole('LECTURER', 'TA', 'SUPER_ADMIN');
  const ownerId = lecturerScopeId(user);
  const courseIds = await scopedCourseIds(user);

  const [courses, materialCount, tas, activity, pendingBoosts, announcements, downloads] =
    await Promise.all([
      prisma.course.findMany({
        where: { lecturerId: ownerId },
        orderBy: { code: 'asc' },
        select: {
          id: true,
          code: true,
          title: true,
          level: true,
          _count: { select: { materials: true, notifSubs: true } },
        },
      }),
      prisma.material.count({ where: { courseId: { in: courseIds } } }),
      prisma.user.findMany({
        where: { addedById: ownerId, role: 'TA', active: true },
        select: { id: true, name: true, email: true },
      }),
      prisma.tAActivityLog.findMany({
        where: { lecturerId: ownerId },
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: { actor: { select: { name: true, role: true } } },
      }),
      prisma.boostRequest.count({
        where: { status: 'PENDING', courseId: { in: courseIds } },
      }),
      prisma.announcement.findMany({
        where: { courseId: { in: courseIds } },
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: {
          course: { select: { code: true } },
          author: { select: { name: true } },
        },
      }),
      prisma.material.aggregate({
        where: { courseId: { in: courseIds } },
        _sum: { downloadCount: true },
      }),
    ]);

  const unseen = activity.filter((a) => !a.seen).length;
  const subscribers = courses.reduce((n, c) => n + c._count.notifSubs, 0);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${firstName(user.name)}`}
        description={
          user.role === 'TA'
            ? 'You have the same permissions as your lecturer for their courses. Everything you do is shown on their dashboard.'
            : 'Your courses, your team and everything published under your name.'
        }
        action={
          <Link href="/upload" className="btn-primary">
            <Upload className="h-4 w-4" />
            Publish material
          </Link>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="My courses" value={courses.length} accent="brand" />
        <Stat label="Materials" value={materialCount} accent="emerald" />
        <Stat
          label="Downloads"
          value={(downloads._sum.downloadCount ?? 0).toLocaleString()}
          accent="gold"
        />
        <Stat
          label="Subscribers"
          value={subscribers}
          sub="students following these courses"
          accent="ink"
        />
      </div>

      {pendingBoosts > 0 && (
        <div className="mb-6">
          <Callout tone="warn" title={`${pendingBoosts} boost request(s) waiting`}>
            Students have asked you to consider their points.{' '}
            <Link href="/lecturer/boost-requests" className="font-semibold underline">
              Review them
            </Link>
            . Nothing is applied to any grade automatically.
          </Callout>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <Activity className="h-4 w-4 text-brand-600" />
              Team activity
              {unseen > 0 && (
                <span className="badge-paid">{unseen} new</span>
              )}
            </h2>
            {unseen > 0 && user.role !== 'TA' && (
              <form action={markActivitySeen}>
                <button className="btn-ghost btn-sm">Mark all seen</button>
              </form>
            )}
          </div>

          {activity.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-8 w-8" />}
              title="No activity yet"
              description="Uploads, announcements and points assigned by you or your TAs appear here."
            />
          ) : (
            <ul className="card divide-y divide-ink-100 overflow-hidden">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className={`relative flex items-start gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-ink-50/70 ${
                    !a.seen ? 'bg-gold-50/50' : ''
                  }`}
                >
                  {/* Unread gets a marker rail rather than a full colour wash —
                      it survives the row being hovered. */}
                  {!a.seen && (
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-[3px] bg-gold-500"
                    />
                  )}
                  <span className="badge-neutral mt-0.5 shrink-0">
                    {ACTION_LABEL[a.action] ?? a.action}
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-ink-800">{a.summary}</p>
                    <p className="mt-1 text-xs text-ink-400">
                      {a.actor.role === 'TA' ? 'TA · ' : ''}
                      {relativeTime(a.createdAt)}
                    </p>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <BookOpen className="h-4 w-4 text-brand-600" />
              My courses
            </h2>
            {courses.length === 0 ? (
              <EmptyState
                title="No courses assigned"
                description="Ask the platform administrator to assign you as the primary lecturer for your courses."
              />
            ) : (
              <ul className="card divide-y divide-ink-100">
                {courses.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-ink-500">{c.code}</p>
                      <p className="truncate text-sm font-medium text-ink-900">
                        {c.title}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-ink-500">
                      <p>{c._count.materials} materials</p>
                      <p>{c._count.notifSubs} subscribers</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <Users className="h-4 w-4 text-brand-600" />
              Teaching assistants
            </h2>
            <div className="card p-4">
              {tas.length === 0 ? (
                <p className="text-sm text-ink-500">
                  No TAs yet. You can add up to {MAX_TAS_PER_LECTURER}.
                </p>
              ) : (
                <ul className="space-y-2">
                  {tas.map((ta) => (
                    <li key={ta.id} className="text-sm">
                      <span className="font-medium text-ink-900">{ta.name}</span>
                      <span className="block text-xs text-ink-500">{ta.email}</span>
                    </li>
                  ))}
                </ul>
              )}
              {user.role === 'LECTURER' && (
                <Link
                  href="/lecturer/team"
                  className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
                >
                  Manage team ({tas.length}/{MAX_TAS_PER_LECTURER}) →
                </Link>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <Megaphone className="h-4 w-4 text-brand-600" />
              Recent announcements
            </h2>
            <div className="card divide-y divide-ink-100">
              {announcements.length === 0 ? (
                <p className="px-4 py-6 text-sm text-ink-500">
                  Nothing posted yet.{' '}
                  <Link
                    href="/lecturer/announcements"
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    Post an update
                  </Link>
                </p>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-ink-900">{a.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {a.course.code} · {a.recipients} recipients ·{' '}
                      {formatDate(a.createdAt)} · {a.author.name}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/lecturer/announcements" className="btn-outline">
          <Megaphone className="h-4 w-4" /> Post announcement
        </Link>
        <Link href="/lecturer/points" className="btn-outline">
          <Sparkles className="h-4 w-4" /> Award purchase points
        </Link>
      </div>
    </div>
  );
}
