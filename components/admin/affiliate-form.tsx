'use client';

import { useActionState, useState } from 'react';
import { Plus } from 'lucide-react';
import { upsertAffiliateLink } from '@/app/actions/admin-actions';
import type { ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';

export type AffiliateRecord = {
  id: string;
  label: string;
  description: string | null;
  targetUrl: string;
  placement: string;
  active: boolean;
};

const PLACEMENTS = [
  { value: 'post-download', label: 'After a download (free or paid)' },
  { value: 'material-page', label: 'Material page sidebar' },
  { value: 'checkout', label: 'After checkout' },
];

export default function AffiliateForm({ link }: { link?: AffiliateRecord }) {
  const [state, action] = useActionState<ActionState, FormData>(
    upsertAffiliateLink,
    {}
  );
  const [open, setOpen] = useState(!!link);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="h-4 w-4" />
        Add affiliate link
      </button>
    );
  }

  return (
    <form action={action} className="card space-y-4 p-5">
      {link && <input type="hidden" name="id" value={link.id} />}
      <p className="font-medium text-ink-900">
        {link ? 'Edit link' : 'New affiliate link'}
      </p>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-700">{state.message}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`label-${link?.id ?? 'new'}`}>
            Label
          </label>
          <input
            id={`label-${link?.id ?? 'new'}`}
            name="label"
            required
            defaultValue={link?.label}
            className="input"
            placeholder="Summarise this with NotebookLM"
          />
        </div>
        <div>
          <label className="label" htmlFor={`url-${link?.id ?? 'new'}`}>
            Target URL
          </label>
          <input
            id={`url-${link?.id ?? 'new'}`}
            name="targetUrl"
            required
            defaultValue={link?.targetUrl}
            className="input"
            placeholder="https://partner.example.com/?ref=cctu"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`desc-${link?.id ?? 'new'}`}>
          Description
        </label>
        <input
          id={`desc-${link?.id ?? 'new'}`}
          name="description"
          defaultValue={link?.description ?? ''}
          className="input"
          placeholder="One line students will actually read."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`place-${link?.id ?? 'new'}`}>
            Placement
          </label>
          <select
            id={`place-${link?.id ?? 'new'}`}
            name="placement"
            defaultValue={link?.placement ?? 'post-download'}
            className="input"
          >
            {PLACEMENTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2.5 text-sm text-ink-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={link?.active ?? true}
            className="h-4 w-4 rounded border-ink-300 text-brand-600"
          />
          Active
        </label>
      </div>

      <div className="flex gap-2">
        <SubmitButton pendingLabel="Saving…">{link ? 'Save' : 'Add link'}</SubmitButton>
        {!link && (
          <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
