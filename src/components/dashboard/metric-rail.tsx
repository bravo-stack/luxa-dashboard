import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';

import type { MetricSummary } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

type MetricRailProps = {
  metrics: MetricSummary[];
  icons?: LucideIcon[];
  className?: string;
};

export function MetricRail({ metrics, icons = [], className }: MetricRailProps) {
  return (
    <section
      className={cn(
        'grid overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.055)] sm:grid-cols-2 xl:grid-cols-4',
        className,
      )}
      aria-label="Key performance indicators"
    >
      {metrics.map((metric, index) => {
        const Icon = icons[index];
        const TrendIcon =
          metric.trendDirection === 'up'
            ? ArrowUpRight
            : metric.trendDirection === 'down'
              ? ArrowDownRight
              : ArrowRight;

        return (
          <article
            key={metric.key}
            className={cn(
              'relative min-w-0 border-border p-5 sm:p-6',
              index > 0 && 'border-t',
              index === 1 && 'sm:border-t-0',
              index % 2 === 1 && 'sm:border-l',
              index > 1 && 'sm:border-t',
              index < 4 && 'xl:border-t-0',
              index >= 4 && 'xl:border-t',
              index % 4 !== 0 && 'xl:border-l',
              index % 4 === 0 && 'xl:border-l-0',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                {metric.label}
              </p>
              {Icon ? (
                <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              ) : null}
            </div>
            <p className="mt-4 text-[2rem] leading-none font-semibold tracking-[-0.045em] text-foreground tabular-nums sm:text-[2.25rem]">
              {metric.value}
            </p>
            <div className="mt-5 flex min-w-0 items-center gap-2 text-xs">
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 font-semibold',
                  metric.trendDirection === 'up' && 'text-success',
                  metric.trendDirection === 'down' && 'text-destructive',
                  metric.trendDirection === 'flat' && 'text-muted-foreground',
                )}
              >
                <TrendIcon className="size-3.5" aria-hidden="true" />
                {metric.trend}
              </span>
              <span className="truncate text-muted-foreground">{metric.note}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
