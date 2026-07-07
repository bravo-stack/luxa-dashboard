import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';

import type { MetricSummary } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

type MetricCardProps = {
  metric: MetricSummary;
  icon: LucideIcon;
  emphasis?: boolean;
};

export function MetricCard({ metric, icon: Icon, emphasis }: MetricCardProps) {
  const TrendIcon =
    metric.trendDirection === 'up'
      ? ArrowUpRight
      : metric.trendDirection === 'down'
        ? ArrowDownRight
        : ArrowRight;

  return (
    <article
      className={cn(
        'surface-elevated card-lift rounded-2xl p-5',
        emphasis && 'surface-premium gradient-border-panel rounded-3xl',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
          <p className="mt-3 font-mono text-3xl font-semibold text-foreground">
            {metric.value}
          </p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
            metric.trendDirection === 'up' &&
              'border-accent-teal/30 bg-accent-teal/10 text-accent-teal',
            metric.trendDirection === 'down' &&
              'border-accent-warm/35 bg-accent-warm/10 text-accent-warm',
            metric.trendDirection === 'flat' &&
              'border-border bg-white/3 text-muted-foreground',
          )}
        >
          <TrendIcon className="size-3.5" aria-hidden="true" />
          {metric.trend}
        </div>
        <p className="truncate text-xs text-muted-foreground">{metric.note}</p>
      </div>
      <div className="mt-5 flex h-8 items-end gap-1" aria-hidden="true">
        {[34, 48, 42, 66, 58, 78, 72].map((height, index) => (
          <span
            key={index}
            className="flex-1 rounded-t-sm bg-primary/20"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </article>
  );
}
