'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil } from 'lucide-react';
import {
  createCourse,
  createDepartment,
  createFaculty,
  deleteTaxonomyNode,
  updateCourse,
} from '@/app/actions/admin-actions';
import type { ActionState } from '@/app/actions/material-actions';
import SubmitButton from '@/components/ui/submit-button';
import ConfirmButton from '@/components/ui/confirm-button';
import { LEVELS } from '@/lib/config';

export type TaxonomyFaculty = {
  id: string;
  name: string;
  departments: {
    id: string;
    name: string;
    courses: {
      id: string;
      code: string;
      title: string;
      level: number;
      lecturerId: string | null;
      _count: { materials: number };
    }[];
  }[];
};

type Lecturer = { id: string; name: string };

function Feedback({ state }: { state: ActionState }) {
  if (state.error)
    return <p className="mt-2 text-xs text-red-600">{state.error}</p>;
  if (state.ok)
    return <p className="mt-2 text-xs text-emerald-700">{state.message}</p>;
  return null;
}

export default function TaxonomyManager({
  faculties,
  lecturers,
}: {
  faculties: TaxonomyFaculty[];
  lecturers: Lecturer[];
}) {
  const [facState, facAction] = useFormState<ActionState, FormData>(createFaculty, {});
  const [depState, depAction] = useFormState<ActionState, FormData>(createDepartment, {});
  const [crsState, crsAction] = useFormState<ActionState, FormData>(createCourse, {});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [newCourseDept, setNewCourseDept] = useState<string | null>(null);

  const allDepartments = faculties.flatMap((f) =>
    f.departments.map((d) => ({ ...d, faculty: f.name }))
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {faculties.map((faculty) => (
          <div key={faculty.id} className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 bg-ink-50 px-4 py-3">
              <button
                onClick={() =>
                  setOpen((o) => ({ ...o, [faculty.id]: !o[faculty.id] }))
                }
                className="flex min-w-0 items-center gap-2 text-left"
              >
                {open[faculty.id] ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-ink-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" />
                )}
                <span className="truncate font-medium text-ink-900">
                  {faculty.name}
                </span>
                <span className="badge-neutral shrink-0">
                  {faculty.departments.length} dept
                </span>
              </button>
              <form action={deleteTaxonomyNode}>
                <input type="hidden" name="kind" value="faculty" />
                <input type="hidden" name="id" value={faculty.id} />
                <ConfirmButton
                  className="btn-ghost btn-sm text-ink-400 hover:text-red-600"
                  message={`Delete ${faculty.name} and every department, course and material under it?`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </ConfirmButton>
              </form>
            </div>

            {open[faculty.id] && (
              <div className="divide-y divide-ink-100">
                {faculty.departments.map((dept) => (
                  <div key={dept.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-ink-800">{dept.name}</p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            setNewCourseDept(newCourseDept === dept.id ? null : dept.id)
                          }
                          className="btn-ghost btn-sm"
                        >
                          <Plus className="h-3.5 w-3.5" /> Course
                        </button>
                        <form action={deleteTaxonomyNode}>
                          <input type="hidden" name="kind" value="department" />
                          <input type="hidden" name="id" value={dept.id} />
                          <ConfirmButton
                            className="btn-ghost btn-sm text-ink-400 hover:text-red-600"
                            message={`Delete ${dept.name} and all its courses?`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </ConfirmButton>
                        </form>
                      </div>
                    </div>

                    {newCourseDept === dept.id && (
                      <form
                        action={crsAction}
                        className="mt-3 grid gap-2 rounded-lg border border-brand-200 bg-brand-50 p-3 sm:grid-cols-[110px_1fr_90px_auto]"
                      >
                        <input type="hidden" name="departmentId" value={dept.id} />
                        <input
                          name="code"
                          required
                          placeholder="CSC 101"
                          className="input"
                        />
                        <input
                          name="title"
                          required
                          placeholder="Introduction to Computing"
                          className="input"
                        />
                        <select name="level" className="input" defaultValue={100}>
                          {LEVELS.map((l) => (
                            <option key={l} value={l}>
                              L{l}
                            </option>
                          ))}
                        </select>
                        <SubmitButton className="btn-primary btn-sm">Add</SubmitButton>
                        <div className="sm:col-span-4">
                          <Feedback state={crsState} />
                        </div>
                      </form>
                    )}

                    <ul className="mt-2 space-y-1">
                      {dept.courses.map((course) => (
                        <li
                          key={course.id}
                          className="rounded-lg px-2 py-1.5 text-sm hover:bg-ink-50"
                        >
                          {editing === course.id ? (
                            <CourseEditor
                              course={course}
                              lecturers={lecturers}
                              onDone={() => setEditing(null)}
                            />
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span className="min-w-0 truncate">
                                <span className="font-mono text-xs text-ink-500">
                                  {course.code}
                                </span>{' '}
                                <span className="text-ink-800">{course.title}</span>{' '}
                                <span className="text-xs text-ink-400">
                                  · L{course.level} · {course._count.materials} materials
                                  {course.lecturerId
                                    ? ` · ${lecturers.find((l) => l.id === course.lecturerId)?.name ?? 'assigned'}`
                                    : ' · no lecturer'}
                                </span>
                              </span>
                              <span className="flex shrink-0 items-center">
                                <button
                                  onClick={() => setEditing(course.id)}
                                  className="btn-ghost btn-sm"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <form action={deleteTaxonomyNode}>
                                  <input type="hidden" name="kind" value="course" />
                                  <input type="hidden" name="id" value={course.id} />
                                  <ConfirmButton
                                    className="btn-ghost btn-sm text-ink-400 hover:text-red-600"
                                    message={`Delete ${course.code} and its ${course._count.materials} material(s)?`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </ConfirmButton>
                                </form>
                              </span>
                            </div>
                          )}
                        </li>
                      ))}
                      {dept.courses.length === 0 && (
                        <li className="px-2 py-1 text-xs text-ink-400">
                          No courses yet.
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <form action={facAction} className="card space-y-3 p-4">
          <p className="font-medium text-ink-900">Add faculty</p>
          <input name="name" required placeholder="Faculty of Engineering" className="input" />
          <SubmitButton className="btn-primary btn-sm w-full">Add faculty</SubmitButton>
          <Feedback state={facState} />
        </form>

        <form action={depAction} className="card space-y-3 p-4">
          <p className="font-medium text-ink-900">Add department</p>
          <select name="facultyId" required className="input">
            <option value="">Choose faculty…</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <input name="name" required placeholder="Civil Engineering" className="input" />
          <SubmitButton className="btn-primary btn-sm w-full">Add department</SubmitButton>
          <Feedback state={depState} />
        </form>

        <div className="card p-4 text-xs leading-relaxed text-ink-500">
          <p className="mb-1 font-medium text-ink-800">Before launch</p>
          Replace this provisional structure with the official faculty, department
          and course list from the registrar ({allDepartments.length} departments
          loaded).
        </div>
      </div>
    </div>
  );
}

function CourseEditor({
  course,
  lecturers,
  onDone,
}: {
  course: TaxonomyFaculty['departments'][number]['courses'][number];
  lecturers: Lecturer[];
  onDone: () => void;
}) {
  const [state, action] = useFormState<ActionState, FormData>(updateCourse, {});

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[1fr_80px_160px_auto]">
      <input type="hidden" name="courseId" value={course.id} />
      <input name="title" defaultValue={course.title} className="input" required />
      <select name="level" defaultValue={course.level} className="input">
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            L{l}
          </option>
        ))}
      </select>
      <select name="lecturerId" defaultValue={course.lecturerId ?? ''} className="input">
        <option value="">No lecturer</option>
        {lecturers.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <span className="flex gap-1">
        <SubmitButton className="btn-primary btn-sm">Save</SubmitButton>
        <button type="button" onClick={onDone} className="btn-ghost btn-sm">
          Cancel
        </button>
      </span>
    </form>
  );
}
