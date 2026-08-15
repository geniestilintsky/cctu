'use client';

import { useFormState } from 'react-dom';
import { Megaphone } from 'lucide-react';
import { postAnnouncement } from '@/app/actions/lecturer-actions';
import type { ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';

export type CourseChoice = {
  id: string;
  code: string;
  title: string;
  subscribers: number;
};

export default function AnnouncementForm({ courses }: { courses: CourseChoice[] }) {
  const [state, action] = useFormState<ActionState, FormData>(postAnnouncement, {});

  return (
    <form action={action} key={state.ok ? 'sent' : 'draft'} className="card space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-brand-600" />
        <p className="font-medium text-ink-900">Post an announcement</p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message}
        </p>
      )}

      <div>
        <label className="label" htmlFor="courseId">
          Course
        </label>
        <select id="courseId" name="courseId" required className="input">
          <option value="">Choose a course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title} ({c.subscribers} subscriber
              {c.subscribers === 1 ? '' : 's'})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          className="input"
          placeholder="Mid-semester quiz moved to week 8"
        />
      </div>

      <div>
        <label className="label" htmlFor="body">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          rows={5}
          required
          className="input"
          placeholder="Write the update exactly as students should read it."
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-ink-500">
          Sent by email now. WhatsApp delivery is added in Phase 2 — the same
          announcement will fan out to both.
        </p>
        <SubmitButton pendingLabel="Sending…">Post &amp; notify</SubmitButton>
      </div>
    </form>
  );
}
