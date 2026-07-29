import type { WebVitalSummary } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

function formatVital(vital: WebVitalSummary) {
  if (vital.p75 === null) {
    return '—';
  }

  return vital.unit === 'score'
    ? vital.p75.toFixed(3)
    : `${Math.round(vital.p75).toLocaleString()}ms`;
}

const ratingLabel: Record<WebVitalSummary['rating'], string> = {
  good: 'Good',
  'needs-improvement': 'Review',
  poor: 'Poor',
  unavailable: 'Awaiting data',
};

export function WebVitalsPanel({ vitals }: { vitals: WebVitalSummary[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-5">
        <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
          Experience quality
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
          Core Web Vitals
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Field performance at the 75th percentile.
        </p>
      </div>
      <div className="divide-y divide-border">
        {vitals.map((vital) => (
          <div
            key={vital.key}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'size-2 rounded-full',
                    vital.rating === 'good' && 'bg-success',
                    vital.rating === 'needs-improvement' && 'bg-warning',
                    vital.rating === 'poor' && 'bg-destructive',
                    vital.rating === 'unavailable' && 'bg-muted-foreground/35',
                  )}
                />
                <p className="truncate text-sm font-semibold text-foreground">
                  {vital.key.toUpperCase()}
                </p>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  {vital.label}
                </p>
              </div>
              <p className="mt-1 pl-4 text-[0.6875rem] text-muted-foreground sm:hidden">
                {vital.label}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-semibold text-foreground">
                {formatVital(vital)}
              </p>
              <p
                className={cn(
                  'mt-1 text-[0.6875rem] font-semibold',
                  vital.rating === 'good' && 'text-success',
                  vital.rating === 'needs-improvement' && 'text-warning',
                  vital.rating === 'poor' && 'text-destructive',
                  vital.rating === 'unavailable' && 'text-muted-foreground',
                )}
              >
                {ratingLabel[vital.rating]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
