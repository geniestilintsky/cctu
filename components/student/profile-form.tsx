'use client';

import { useFormState } from 'react-dom';
import { updateProfile } from '@/app/actions/student-actions';
import type { ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';

export default function ProfileForm({
  name,
  phone,
  indexNumber,
  email,
}: {
  name: string;
  phone: string | null;
  indexNumber: string | null;
  email: string;
}) {
  const [state, action] = useFormState<ActionState, FormData>(updateProfile, {});

  return (
    <form action={action} className="card space-y-4 p-5">
      <p className="font-medium text-ink-900">Contact details</p>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message}
        </p>
      )}

      <div>
        <label className="label" htmlFor="p-name">
          Full name
        </label>
        <input id="p-name" name="name" defaultValue={name} required className="input" />
      </div>

      <div>
        <label className="label" htmlFor="p-email">
          Email
        </label>
        <input id="p-email" value={email} disabled className="input bg-ink-50 text-ink-500" />
        <p className="hint">Contact support to change your email.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="p-phone">
            Phone
          </label>
          <input
            id="p-phone"
            name="phone"
            defaultValue={phone ?? ''}
            className="input"
            placeholder="+233 55 000 0000"
          />
          <p className="hint">Required for WhatsApp alerts in Phase 2.</p>
        </div>
        <div>
          <label className="label" htmlFor="p-index">
            Index number
          </label>
          <input
            id="p-index"
            name="indexNumber"
            defaultValue={indexNumber ?? ''}
            className="input"
            placeholder="CS/2022/0451"
          />
          <p className="hint">Only needed when redeeming points.</p>
        </div>
      </div>

      <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
    </form>
  );
}
