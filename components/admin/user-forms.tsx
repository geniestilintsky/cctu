'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { KeyRound, UserPlus } from 'lucide-react';
import { createLecturer, resetUserPassword } from '@/app/actions/admin-actions';
import type { ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';

export function AddLecturerForm() {
  const [state, action] = useFormState<ActionState, FormData>(createLecturer, {});
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="btn-primary">
        <UserPlus className="h-4 w-4" />
        Add lecturer
      </button>

      {open && (
        <form action={action} className="card mt-4 space-y-4 p-5">
          <p className="font-medium text-ink-900">New lecturer account</p>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state.ok && <p className="text-sm text-emerald-700">{state.message}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="l-name">
                Full name
              </label>
              <input id="l-name" name="name" required className="input" placeholder="Dr. Ama Boateng" />
            </div>
            <div>
              <label className="label" htmlFor="l-email">
                University email
              </label>
              <input
                id="l-email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="a.boateng@cctu.edu.gh"
              />
            </div>
            <div>
              <label className="label" htmlFor="l-phone">
                Phone <span className="font-normal text-ink-400">(optional)</span>
              </label>
              <input id="l-phone" name="phone" className="input" placeholder="+233 24 000 0000" />
            </div>
            <div>
              <label className="label" htmlFor="l-password">
                Temporary password
              </label>
              <input
                id="l-password"
                name="password"
                required
                minLength={8}
                className="input"
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          <p className="hint">
            The lecturer is emailed sign-in instructions. They can add up to 3
            teaching assistants themselves.
          </p>

          <div className="flex gap-2">
            <SubmitButton pendingLabel="Creating…">Create account</SubmitButton>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Close
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [state, action] = useFormState<ActionState, FormData>(resetUserPassword, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost btn-sm" title="Reset password">
        <KeyRound className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input
        name="password"
        required
        minLength={8}
        placeholder="New password"
        className="input w-36 py-1 text-xs"
      />
      <SubmitButton className="btn-primary btn-sm">Set</SubmitButton>
      <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">
        ✕
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state.ok && <span className="text-xs text-emerald-700">Done</span>}
    </form>
  );
}
