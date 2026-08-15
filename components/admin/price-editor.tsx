'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { setMaterialPrice } from '@/app/actions/admin-actions';
import type { ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';
import { PriceBadge } from '@/components/ui/primitives';

export default function PriceEditor({
  materialId,
  isFree,
  price,
}: {
  materialId: string;
  isFree: boolean;
  price: string | null;
}) {
  const [state, action] = useFormState<ActionState, FormData>(setMaterialPrice, {});
  const [open, setOpen] = useState(false);
  const [paid, setPaid] = useState(!isFree);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="transition-opacity hover:opacity-70"
        title="Change price"
      >
        <PriceBadge isFree={isFree} price={price} />
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="materialId" value={materialId} />
      <label className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          name="paid"
          checked={paid}
          onChange={(e) => setPaid(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600"
        />
        Paid
      </label>
      {paid && (
        <input
          name="price"
          type="number"
          min="1"
          step="0.5"
          defaultValue={price ?? ''}
          className="input w-20 py-1 text-xs"
        />
      )}
      <SubmitButton className="btn-primary btn-sm">Save</SubmitButton>
      <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">
        ✕
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
