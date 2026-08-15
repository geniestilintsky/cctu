'use client';

import { useActionState, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { addTeachingAssistant } from '@/app/actions/lecturer-actions';
import type { ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';

export default function AddTAForm({ remaining }: { remaining: number }) {
  const [state, action] = useActionState<ActionState, FormData>(
    addTeachingAssistant,
    {}
  );
  const [open, setOpen] = useState(false);

  if (remaining <= 0) {
    return (
      <p className="rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600">
        You have used all 3 teaching assistant slots. Remove one to add another.
      </p>
    );
  }

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="btn-primary">
        <UserPlus className="h-4 w-4" />
        Add teaching assistant
      </button>

      {open && (
        <form action={action} className="card mt-4 space-y-4 p-5">
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state.ok && <p className="text-sm text-emerald-700">{state.message}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="ta-name">
                Full name
              </label>
              <input id="ta-name" name="name" required className="input" placeholder="Joseph Owusu" />
            </div>
            <div>
              <label className="label" htmlFor="ta-email">
                Email
              </label>
              <input
                id="ta-email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="j.owusu@cctu.edu.gh"
              />
            </div>
            <div>
              <label className="label" htmlFor="ta-phone">
                Phone <span className="font-normal text-ink-400">(optional)</span>
              </label>
              <input id="ta-phone" name="phone" className="input" placeholder="+233 24 000 0000" />
            </div>
            <div>
              <label className="label" htmlFor="ta-password">
                Temporary password
              </label>
              <input
                id="ta-password"
                name="password"
                required
                minLength={8}
                className="input"
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          <p className="hint">
            Your TA gets the same dashboard and permissions for your courses.
            Every action they take is logged and shown to you.
          </p>

          <div className="flex gap-2">
            <SubmitButton pendingLabel="Creating…">Create TA account</SubmitButton>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Close
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
