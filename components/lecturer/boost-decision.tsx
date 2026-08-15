'use client';

import { useActionState, useState } from 'react';
import { decideBoostRequest } from '@/app/actions/lecturer-actions';
import type { ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';
import { formatDateTime } from '@/lib/utils';

export type BoostItem = {
  id: string;
  pointsUsed: number;
  message: string | null;
  indexNumber: string | null;
  createdAt: string;
  student: { name: string; email: string; indexNumber: string | null };
  course: { code: string; title: string };
  balance: number;
};

export default function BoostDecision({ request }: { request: BoostItem }) {
  const [state, action] = useActionState<ActionState, FormData>(decideBoostRequest, {});
  const [open, setOpen] = useState(false);

  if (state.ok) {
    return (
      <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        {request.student.name} — {state.message}
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="badge-neutral font-mono">{request.course.code}</span>
            <span className="badge-paid">{request.pointsUsed} points</span>
          </div>
          <p className="font-medium text-ink-900">{request.student.name}</p>
          <p className="text-xs text-ink-500">
            {request.student.email}
            {request.indexNumber || request.student.indexNumber
              ? ` · index ${request.indexNumber || request.student.indexNumber}`
              : ' · no index number on file'}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            Requested {formatDateTime(request.createdAt)} · balance after approval:{' '}
            {request.balance - request.pointsUsed} points
          </p>
        </div>
        {!open && (
          <button onClick={() => setOpen(true)} className="btn-outline btn-sm">
            Decide
          </button>
        )}
      </div>

      {request.message && (
        <p className="mt-3 rounded-lg bg-ink-50 p-3 text-sm text-ink-600">
          “{request.message}”
        </p>
      )}

      {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}

      {open && (
        <form action={action} className="mt-4 space-y-3 rounded-lg border border-ink-200 bg-ink-50 p-4">
          <input type="hidden" name="requestId" value={request.id} />
          <div>
            <label className="label text-xs" htmlFor={`note-${request.id}`}>
              Note to the student <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <textarea
              id={`note-${request.id}`}
              name="note"
              rows={2}
              className="input"
              placeholder="e.g. Noted — I will apply the maximum 2% under the faculty policy."
            />
          </div>
          <p className="text-xs text-ink-500">
            Approving records your decision and spends the student&apos;s points. It
            does not change any grade — you apply that yourself under university
            policy.
          </p>
          <div className="flex gap-2">
            <SubmitButton name="decision" value="approve" className="btn-primary btn-sm">
              Approve
            </SubmitButton>
            <SubmitButton name="decision" value="reject" className="btn-outline btn-sm">
              Reject
            </SubmitButton>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
