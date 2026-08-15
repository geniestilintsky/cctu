'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { Flag } from 'lucide-react';
import { reportMaterial, type ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';

const REASONS = [
  'Copyright / I own this work',
  'Wrong course or duplicate',
  'Contains exam answers that should not be public',
  'Poor quality or unreadable scan',
  'Other',
];

export default function ReportForm({ materialId }: { materialId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState<ActionState, FormData>(reportMaterial, {});

  if (state.ok) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
        {state.message}
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-red-600"
      >
        <Flag className="h-3.5 w-3.5" />
        Report this content
      </button>

      {open && (
        <form action={action} className="mt-3 space-y-3 rounded-lg border border-ink-200 bg-ink-50 p-3">
          <input type="hidden" name="materialId" value={materialId} />
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}

          <div>
            <label className="label text-xs" htmlFor="reason">
              Reason
            </label>
            <select id="reason" name="reason" required className="input text-sm">
              <option value="">Select a reason…</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label text-xs" htmlFor="details">
              Details <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <textarea id="details" name="details" rows={3} className="input text-sm" />
          </div>

          <div>
            <label className="label text-xs" htmlFor="contact">
              Contact email <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <input id="contact" name="contact" type="email" className="input text-sm" />
          </div>

          <div className="flex gap-2">
            <SubmitButton className="btn-danger btn-sm" pendingLabel="Sending…">
              Send report
            </SubmitButton>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
