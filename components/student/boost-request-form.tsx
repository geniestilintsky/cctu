'use client';

import { useActionState } from 'react';
import { Sparkles } from 'lucide-react';
import { submitBoostRequest } from '@/app/actions/student-actions';
import type { ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';

export default function BoostRequestForm({
  courses,
  available,
  indexNumber,
}: {
  courses: { id: string; code: string; title: string; lecturer: string | null }[];
  available: number;
  indexNumber: string | null;
}) {
  const [state, action] = useActionState<ActionState, FormData>(submitBoostRequest, {});

  return (
    <form action={action} key={state.ok ? 'sent' : 'draft'} className="card space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-gold-600" />
        <p className="font-medium text-ink-900">Ask a lecturer to consider your points</p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="courseId">
            Course
          </label>
          <select id="courseId" name="courseId" required className="input">
            <option value="">Choose a course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
                {c.lecturer ? ` (${c.lecturer})` : ' (no lecturer assigned)'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="points">
            Points to use
          </label>
          <input
            id="points"
            name="points"
            type="number"
            min={1}
            max={Math.max(1, available)}
            required
            className="input"
            placeholder={String(Math.min(10, available))}
          />
          <p className="hint">{available} available to commit.</p>
        </div>

        <div>
          <label className="label" htmlFor="indexNumber">
            Index number
          </label>
          <input
            id="indexNumber"
            name="indexNumber"
            defaultValue={indexNumber ?? ''}
            required
            className="input"
            placeholder="CS/2022/0451"
          />
          <p className="hint">Your lecturer needs this to identify you.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="message">
            Message <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            className="input"
            placeholder="Anything your lecturer should know about this request."
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-ink-500">
          Your lecturer decides individually. Nothing is applied to any grade
          automatically.
        </p>
        <SubmitButton disabled={available <= 0} pendingLabel="Sending…">
          Send request
        </SubmitButton>
      </div>
    </form>
  );
}
