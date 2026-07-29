import type { ActivityCell } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function cellTone(value: number, max: number) {
  if (value === 0 || max === 0) {
    return 'bg-muted/55';
  }

  const ratio = value / max;

  if (ratio >= 0.75) return 'bg-primary';
  if (ratio >= 0.45) return 'bg-primary/65';
  if (ratio >= 0.2) return 'bg-primary/35';
  return 'bg-primary/16';
}

export function ActivityHeatmap({ data }: { data: ActivityCell[] }) {
  const max = Math.max(...data.map((cell) => cell.value), 0);
  const byCoordinate = new Map(
    data.map((cell) => [`${cell.day}-${cell.hour}`, cell.value]),
  );
  const hasData = data.some((cell) => cell.value > 0);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-5">
        <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
          Timing intelligence
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
          When attention concentrates
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Session density by weekday and hour, in UTC.
        </p>
      </div>
      <div className="overflow-x-auto p-5">
        <div className="min-w-150">
          <div className="mb-2 grid grid-cols-[36px_repeat(24,minmax(14px,1fr))] gap-1">
            <span />
            {Array.from({ length: 24 }, (_, hour) => (
              <span
                key={hour}
                className="text-center text-[0.625rem] text-muted-foreground"
              >
                {hour % 3 === 0 ? String(hour).padStart(2, '0') : ''}
              </span>
            ))}
          </div>
          <div className="space-y-1">
            {dayLabels.map((day, dayIndex) => (
              <div
                key={day}
                className="grid grid-cols-[36px_repeat(24,minmax(14px,1fr))] gap-1"
              >
                <span className="flex items-center text-[0.625rem] font-medium text-muted-foreground">
                  {day}
                </span>
                {Array.from({ length: 24 }, (_, hour) => {
                  const value = byCoordinate.get(`${dayIndex}-${hour}`) ?? 0;

                  return (
                    <span
                      key={hour}
                      className={cn(
                        'aspect-square min-h-3 rounded-[3px]',
                        cellTone(value, max),
                      )}
                      title={`${day} ${String(hour).padStart(2, '0')}:00 — ${value.toLocaleString()} sessions`}
                      aria-label={`${day} at ${hour}:00: ${value} sessions`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 text-[0.6875rem] text-muted-foreground">
            <span>{hasData ? 'Hover cells for exact volume' : 'No sessions yet'}</span>
            <span className="flex items-center gap-1.5">
              Lower
              <span className="size-3 rounded-[3px] bg-muted/55" />
              <span className="size-3 rounded-[3px] bg-primary/35" />
              <span className="size-3 rounded-[3px] bg-primary/65" />
              <span className="size-3 rounded-[3px] bg-primary" />
              Higher
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
