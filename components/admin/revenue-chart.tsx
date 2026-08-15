import { formatMoney } from '@/lib/utils';

export type MonthPoint = { label: string; material: number; subscription: number };

/** Rounds up to a clean axis maximum so gridlines land on readable numbers. */
function niceMax(value: number) {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

/**
 * Pure-CSS stacked columns — no charting dependency, prints cleanly in a board
 * pack, and stays legible at any width.
 */
export default function RevenueChart({ data }: { data: MonthPoint[] }) {
  const peak = Math.max(0, ...data.map((d) => d.material + d.subscription));
  const max = niceMax(peak);
  const total = data.reduce((n, d) => n + d.material + d.subscription, 0);
  const gridlines = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="card p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-medium text-ink-900">Revenue over time</p>
          <p className="mt-0.5 text-xs text-ink-500">
            Last 12 months · {formatMoney(total)} settled
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-brand-600" /> Materials
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-gold-500" /> Subscriptions
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        {/* Y axis */}
        <div className="tabular flex h-56 w-12 shrink-0 flex-col justify-between pb-6 text-right text-[10px] text-ink-400">
          {gridlines.map((g) => (
            <span key={g}>{Math.round(max * g).toLocaleString()}</span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Gridlines sit behind the columns and stop at the baseline. */}
          <div aria-hidden className="absolute inset-x-0 top-0 h-[12.5rem]">
            {gridlines.map((g) => (
              <span
                key={g}
                className="absolute inset-x-0 border-t border-dashed border-ink-100"
                style={{ top: `${(1 - g) * 100}%` }}
              />
            ))}
          </div>

          <div className="scrollbar-thin relative flex h-56 items-end gap-1.5 overflow-x-auto pb-6">
            {data.map((d) => {
              const sum = d.material + d.subscription;
              return (
                <div
                  key={d.label}
                  className="group relative flex h-full min-w-[28px] flex-1 flex-col justify-end"
                >
                  {/* Hover column — gives the whole month a hit area, not just
                      the few pixels of bar. */}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-6 top-0 rounded-md bg-ink-100/0 transition-colors duration-150 group-hover:bg-ink-100/70"
                  />

                  <span className="pointer-events-none absolute inset-x-0 bottom-full z-10 mx-auto mb-1 w-max -translate-y-1 scale-95 rounded-lg bg-ink-900 px-2 py-1.5 text-[11px] leading-tight text-white opacity-0 shadow-lift transition-[opacity,transform] duration-150 ease-out group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
                    <span className="tabular block font-semibold">
                      {formatMoney(sum)}
                    </span>
                    <span className="block text-white/60">
                      {formatMoney(d.material)} · {formatMoney(d.subscription)} sub
                    </span>
                  </span>

                  <span className="relative flex flex-1 flex-col justify-end pb-6">
                    <span
                      className="w-full rounded-t-[3px] bg-gold-500 transition-[height] duration-700 ease-out"
                      style={{ height: `${(d.subscription / max) * 100}%` }}
                    />
                    <span
                      className={`w-full bg-brand-600 transition-[height] duration-700 ease-out ${
                        d.subscription === 0 ? 'rounded-t-[3px]' : ''
                      }`}
                      style={{ height: `${(d.material / max) * 100}%` }}
                    />
                    {sum === 0 && (
                      <span className="h-px w-full bg-ink-200" aria-hidden />
                    )}
                  </span>

                  <span className="absolute inset-x-0 bottom-0 text-center text-[10px] uppercase tracking-wide text-ink-400">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
