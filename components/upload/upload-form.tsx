'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CloudUpload, FileCheck2 } from 'lucide-react';
import { uploadMaterial } from '@/app/actions/upload-actions';
import type { ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';
import { MATERIAL_TYPE_LABELS, ACADEMIC_YEARS, SEMESTERS } from '@/lib/config';
import { formatBytes } from '@/lib/utils';

export type CourseOption = {
  id: string;
  code: string;
  title: string;
  department: string;
};

export default function UploadForm({
  courses,
  canPrice,
  defaultLecturerName,
}: {
  courses: CourseOption[];
  canPrice: boolean;
  defaultLecturerName?: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(uploadMaterial, {});
  const [file, setFile] = useState<File | null>(null);
  const [paid, setPaid] = useState(false);

  const grouped = courses.reduce<Record<string, CourseOption[]>>((acc, c) => {
    (acc[c.department] ||= []).push(c);
    return acc;
  }, {});

  if (state.ok) {
    return (
      <div className="card p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <h2 className="mt-3 font-display text-xl font-semibold">
          {canPrice ? 'Published' : 'Submitted for review'}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">{state.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/browse" className="btn-outline">
            Browse materials
          </Link>
          <Link href="/upload" className="btn-primary">
            Upload another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="card p-5">
        <label
          htmlFor="file"
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/60 px-6 py-10 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40"
        >
          {file ? (
            <>
              <FileCheck2 className="h-8 w-8 text-emerald-500" />
              <span className="mt-2 font-medium text-ink-900">{file.name}</span>
              <span className="text-xs text-ink-500">{formatBytes(file.size)}</span>
              <span className="mt-2 text-xs text-brand-700">Choose a different file</span>
            </>
          ) : (
            <>
              <CloudUpload className="h-8 w-8 text-ink-400" />
              <span className="mt-2 font-medium text-ink-900">
                Click to choose a file
              </span>
              <span className="mt-0.5 text-xs text-ink-500">
                PDF, Word, PowerPoint, image or zip · up to 25 MB
              </span>
            </>
          )}
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          className="sr-only"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="card space-y-5 p-5">
        <div>
          <label className="label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            className="input"
            placeholder="e.g. Data Structures — End of Semester Exam 2023/2024"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="courseId">
              Course
            </label>
            <select id="courseId" name="courseId" required className="input">
              <option value="">Select a course…</option>
              {Object.entries(grouped).map(([dept, list]) => (
                <optgroup key={dept} label={dept}>
                  {list.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="type">
              Material type
            </label>
            <select id="type" name="type" required className="input">
              {Object.entries(MATERIAL_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="lecturerName">
              Lecturer
            </label>
            <input
              id="lecturerName"
              name="lecturerName"
              className="input"
              defaultValue={defaultLecturerName}
              placeholder="Dr. Kwabena Mensah"
            />
            <p className="hint">Lets students filter past papers by lecturer.</p>
          </div>
          <div>
            <label className="label" htmlFor="academicYear">
              Academic year
            </label>
            <select id="academicYear" name="academicYear" className="input">
              <option value="">Not sure</option>
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="semester">
              Semester
            </label>
            <select id="semester" name="semester" className="input">
              <option value="">Not sure</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="description">
            Description <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="input"
            placeholder="What does this cover? Anything a student should know before downloading?"
          />
        </div>

        {canPrice && (
          <div className="rounded-lg border border-ink-200 bg-ink-50 p-4">
            <label className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
              <input
                type="checkbox"
                name="paid"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              Charge for this material
            </label>
            {paid && (
              <div className="mt-3 max-w-[200px]">
                <label className="label" htmlFor="price">
                  Price (GHS)
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="1"
                  step="0.5"
                  className="input"
                  placeholder="10"
                />
              </div>
            )}
            <p className="hint">
              The Super Admin can override any price from the admin dashboard.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-ink-500">
          {canPrice
            ? 'Your upload publishes immediately and is tagged to the course.'
            : 'Student uploads are checked by an administrator before they go live.'}
        </p>
        <SubmitButton pendingLabel="Uploading…">
          {canPrice ? 'Publish material' : 'Submit for review'}
        </SubmitButton>
      </div>
    </form>
  );
}
