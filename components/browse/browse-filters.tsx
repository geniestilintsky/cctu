'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useMemo, useTransition } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { MATERIAL_TYPE_LABELS, LEVELS, ACADEMIC_YEARS } from '@/lib/config';
import { cn } from '@/lib/utils';

export type TaxonomyTree = {
  id: string;
  name: string;
  departments: {
    id: string;
    name: string;
    courses: { id: string; code: string; title: string; level: number }[];
  }[];
}[];

export default function BrowseFilters({ tree }: { tree: TaxonomyTree }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const facultyId = params.get('faculty') || '';
  const departmentId = params.get('department') || '';
  const courseId = params.get('course') || '';
  const level = params.get('level') || '';
  const type = params.get('type') || '';
  const year = params.get('year') || '';
  const price = params.get('price') || '';
  const q = params.get('q') || '';

  const departments = useMemo(
    () => tree.find((f) => f.id === facultyId)?.departments ?? [],
    [tree, facultyId]
  );

  const courses = useMemo(() => {
    const source = departmentId
      ? departments.find((d) => d.id === departmentId)?.courses ?? []
      : departments.flatMap((d) => d.courses);
    return level ? source.filter((c) => String(c.level) === level) : source;
  }, [departments, departmentId, level]);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    next.delete('page');
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  const activeCount = ['faculty', 'department', 'course', 'level', 'type', 'year', 'price', 'q']
    .filter((k) => params.get(k))
    .length;

  return (
    <div
      className={cn(
        'space-y-5 transition-opacity duration-150',
        pending && 'opacity-60'
      )}
    >
      <div>
        <label className="label" htmlFor="q">
          Search
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            id="q"
            defaultValue={q}
            placeholder="Course code, title, lecturer…"
            className="input pl-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter') update({ q: e.currentTarget.value });
            }}
            onBlur={(e) => {
              if (e.currentTarget.value !== q) update({ q: e.currentTarget.value });
            }}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="faculty">
          Faculty
        </label>
        <select
          id="faculty"
          className="input"
          value={facultyId}
          onChange={(e) =>
            update({ faculty: e.target.value, department: null, course: null })
          }
        >
          <option value="">All faculties</option>
          {tree.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="department">
          Department
        </label>
        <select
          id="department"
          className="input disabled:bg-ink-50 disabled:text-ink-400"
          value={departmentId}
          disabled={!facultyId}
          onChange={(e) => update({ department: e.target.value, course: null })}
        >
          <option value="">
            {facultyId ? 'All departments' : 'Choose a faculty first'}
          </option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="level">
          Year / level
        </label>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => update({ level: level === String(l) ? null : String(l) })}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                level === String(l)
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-50'
              )}
            >
              Level {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="course">
          Course
        </label>
        <select
          id="course"
          className="input disabled:bg-ink-50 disabled:text-ink-400"
          value={courseId}
          disabled={!facultyId}
          onChange={(e) => update({ course: e.target.value })}
        >
          <option value="">
            {facultyId ? 'All courses' : 'Choose a faculty first'}
          </option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Material type</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(MATERIAL_TYPE_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => update({ type: type === value ? null : value })}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                type === value
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="year">
            Academic year
          </label>
          <select
            id="year"
            className="input"
            value={year}
            onChange={(e) => update({ year: e.target.value })}
          >
            <option value="">Any year</option>
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="price">
            Price
          </label>
          <select
            id="price"
            className="input"
            value={price}
            onChange={(e) => update({ price: e.target.value })}
          >
            <option value="">Free & paid</option>
            <option value="free">Free only</option>
            <option value="paid">Paid only</option>
          </select>
        </div>
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}
          className="btn-outline btn-sm w-full"
        >
          <X className="h-3.5 w-3.5" />
          Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
        </button>
      )}

      <p className="flex items-center gap-1.5 text-xs text-ink-400">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters update the list instantly.
      </p>
    </div>
  );
}
