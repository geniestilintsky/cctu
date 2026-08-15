'use client';

import { useActionState, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { assignPurchasePoints } from '@/app/actions/lecturer-actions';
import type { ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';

export default function AwardPointsForm({
  purchaseId,
  defaultIndexNumber,
  awarded,
}: {
  purchaseId: string;
  defaultIndexNumber: string | null;
  awarded: number | null;
}) {
  const [state, action] = useActionState<ActionState, FormData>(
    assignPurchasePoints,
    {}
  );
  const [open, setOpen] = useState(false);

  if (awarded !== null) {
    return <span className="badge-free">{awarded} points awarded</span>;
  }
  if (state.ok) {
    return <span className="badge-free">{state.message}</span>;
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-outline btn-sm">
        <Sparkles className="h-3.5 w-3.5" />
        Award points
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-1.5">
      <input type="hidden" name="purchaseId" value={purchaseId} />
      <input
        name="points"
        type="number"
        min="1"
        max="50"
        defaultValue={5}
        required
        className="input w-16 py-1 text-xs"
        aria-label="Points"
      />
      <input
        name="indexNumber"
        defaultValue={defaultIndexNumber ?? ''}
        placeholder="Index no."
        className="input w-28 py-1 text-xs"
        aria-label="Index number"
      />
      <SubmitButton className="btn-primary btn-sm">Award</SubmitButton>
      <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">
        ✕
      </button>
      {state.error && (
        <span className="w-full text-right text-xs text-red-600">{state.error}</span>
      )}
    </form>
  );
}
