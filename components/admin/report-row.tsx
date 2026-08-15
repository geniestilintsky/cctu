'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { resolveReport } from '@/app/actions/admin-actions';
import type { ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';
import { StatusBadge } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/utils';

export type ReportItem = {
  id: string;
  reason: string;
  details: string | null;
  contact: string | null;
  status: string;
  resolution: string | null;
  createdAt: string;
  material: { id: string; title: string; status: string; course: { code: string } };
  reporter: { name: string; email: string } | null;
};

export default function ReportRow({ report }: { report: ReportItem }) {
  const [state, action] = useFormState<ActionState, FormData>(resolveReport, {});
  const [open, setOpen] = useState(false);

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <StatusBadge status={report.status} />
            <span className="badge-neutral font-mono">
              {report.material.course.code}
            </span>
          </div>
          <Link
            href={`/material/${report.material.id}`}
            className="font-medium text-ink-900 hover:text-brand-700"
          >
            {report.material.title}
          </Link>
          <p className="mt-1 text-sm text-ink-700">
            <strong>Reason:</strong> {report.reason}
          </p>
          {report.details && (
            <p className="mt-1 text-sm text-ink-600">{report.details}</p>
          )}
          <p className="mt-2 text-xs text-ink-500">
            Filed {formatDateTime(report.createdAt)}
            {report.reporter ? ` by ${report.reporter.name}` : ' anonymously'}
            {report.contact ? ` · contact: ${report.contact}` : ''}
          </p>
        </div>

        {report.status === 'PENDING' && !state.ok && (
          <button onClick={() => setOpen((v) => !v)} className="btn-outline btn-sm">
            Resolve
          </button>
        )}
      </div>

      {report.resolution && (
        <p className="mt-3 rounded-lg bg-ink-50 p-3 text-sm text-ink-600">
          <strong>Outcome:</strong> {report.resolution}
        </p>
      )}

      {state.ok && (
        <p className="mt-3 text-sm text-emerald-700">{state.message}</p>
      )}

      {open && !state.ok && (
        <form action={action} className="mt-4 space-y-3 rounded-lg border border-ink-200 bg-ink-50 p-4">
          <input type="hidden" name="reportId" value={report.id} />
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div>
            <label className="label text-xs" htmlFor={`res-${report.id}`}>
              Outcome note
            </label>
            <textarea
              id={`res-${report.id}`}
              name="resolution"
              rows={2}
              className="input"
              placeholder="e.g. Verified copyright claim from the publisher — file removed."
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              name="takedown"
              className="h-4 w-4 rounded border-ink-300 text-red-600"
            />
            Take the material down (unpublish it)
          </label>

          <div className="flex gap-2">
            <SubmitButton name="decision" value="approve" className="btn-danger btn-sm">
              Uphold report
            </SubmitButton>
            <SubmitButton name="decision" value="reject" className="btn-outline btn-sm">
              Dismiss report
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
