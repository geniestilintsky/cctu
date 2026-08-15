'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { Check, X, FileText, ExternalLink } from 'lucide-react';
import { approveMaterial, rejectMaterial } from '@/app/actions/admin-actions';
import type { ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';
import { TypeBadge } from '@/components/ui/primitives';
import { formatBytes, formatDateTime } from '@/lib/utils';

export type ReviewItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  academicYear: string | null;
  semester: string | null;
  lecturerName: string | null;
  createdAt: string;
  uploadedBy: { name: string; email: string; indexNumber: string | null };
  course: { code: string; title: string; department: { name: string } };
};

export default function ReviewCard({ item }: { item: ReviewItem }) {
  const [approveState, approve] = useFormState<ActionState, FormData>(
    approveMaterial,
    {}
  );
  const [rejectState, reject] = useFormState<ActionState, FormData>(
    rejectMaterial,
    {}
  );
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle');
  const [paid, setPaid] = useState(false);

  const done = approveState.ok || rejectState.ok;
  if (done) {
    return (
      <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <strong>{item.title}</strong> — {approveState.message || rejectState.message}
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="badge-neutral font-mono">{item.course.code}</span>
            <TypeBadge type={item.type} />
            {item.academicYear && (
              <span className="badge-neutral">{item.academicYear}</span>
            )}
          </div>
          <h3 className="font-medium text-ink-900">{item.title}</h3>
          <p className="text-sm text-ink-500">
            {item.course.title} · {item.course.department.name}
          </p>
        </div>

        <a
          href={item.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-outline btn-sm shrink-0"
        >
          <FileText className="h-3.5 w-3.5" />
          Preview file
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {item.description && (
        <p className="mt-3 rounded-lg bg-ink-50 p-3 text-sm text-ink-600">
          {item.description}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-ink-500 sm:grid-cols-4">
        <div>
          <dt className="font-medium uppercase tracking-wide">Uploader</dt>
          <dd className="mt-0.5 truncate text-ink-800">{item.uploadedBy.name}</dd>
        </div>
        <div>
          <dt className="font-medium uppercase tracking-wide">Index no.</dt>
          <dd className="mt-0.5 text-ink-800">{item.uploadedBy.indexNumber || '—'}</dd>
        </div>
        <div>
          <dt className="font-medium uppercase tracking-wide">Submitted</dt>
          <dd className="mt-0.5 text-ink-800">{formatDateTime(item.createdAt)}</dd>
        </div>
        <div>
          <dt className="font-medium uppercase tracking-wide">File</dt>
          <dd className="mt-0.5 text-ink-800">{formatBytes(item.fileSize)}</dd>
        </div>
      </dl>

      {(approveState.error || rejectState.error) && (
        <p className="mt-3 text-sm text-red-600">
          {approveState.error || rejectState.error}
        </p>
      )}

      {mode === 'idle' && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => setMode('approve')} className="btn-primary btn-sm">
            <Check className="h-3.5 w-3.5" /> Approve
          </button>
          <button onClick={() => setMode('reject')} className="btn-outline btn-sm">
            <X className="h-3.5 w-3.5" /> Reject
          </button>
          <Link href={`/material/${item.id}`} className="btn-ghost btn-sm">
            Open detail page
          </Link>
        </div>
      )}

      {mode === 'approve' && (
        <form action={approve} className="mt-5 space-y-3 rounded-lg border border-brand-200 bg-brand-50 p-4">
          <input type="hidden" name="materialId" value={item.id} />
          <p className="text-sm font-medium text-brand-900">
            Publish this material
          </p>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              name="paid"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-600"
            />
            Charge for this material
          </label>
          {paid && (
            <div className="max-w-[180px]">
              <label className="label text-xs" htmlFor={`price-${item.id}`}>
                Price (GHS)
              </label>
              <input
                id={`price-${item.id}`}
                name="price"
                type="number"
                min="1"
                step="0.5"
                className="input"
                placeholder="10"
              />
            </div>
          )}
          <p className="text-xs text-ink-500">
            Approving awards the uploader upload points automatically.
          </p>
          <div className="flex gap-2">
            <SubmitButton className="btn-primary btn-sm" pendingLabel="Publishing…">
              Approve &amp; publish
            </SubmitButton>
            <button type="button" onClick={() => setMode('idle')} className="btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === 'reject' && (
        <form action={reject} className="mt-5 space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <input type="hidden" name="materialId" value={item.id} />
          <div>
            <label className="label text-xs" htmlFor={`reason-${item.id}`}>
              Reason (sent to the uploader)
            </label>
            <textarea
              id={`reason-${item.id}`}
              name="reason"
              rows={2}
              required
              className="input"
              placeholder="e.g. This is a duplicate of an existing 2023/2024 paper."
            />
          </div>
          <div className="flex gap-2">
            <SubmitButton className="btn-danger btn-sm" pendingLabel="Sending…">
              Reject &amp; notify
            </SubmitButton>
            <button type="button" onClick={() => setMode('idle')} className="btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
