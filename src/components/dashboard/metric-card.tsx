import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import type { MetricSummary } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

type MetricCardProps = {
  metric: MetricSummary;
  icon: LucideIcon;
  emphasis?: boolean;
  className?: string;
};

export function MetricCard({ metric, icon: Icon, emphasis, className }: MetricCardProps) {
  const TrendIcon =
    metric.trendDirection === 'up'
      ? ArrowUpRight
      : metric.trendDirection === 'down'
        ? ArrowDownRight
        : ArrowRight;

  return (
    <Card
      className={cn(
        'card-lift overflow-hidden shadow-none',
        emphasis && 'border-primary/20 bg-surface-premium',
        className,
      )}
    >
      <CardContent className={cn('p-5', emphasis && 'p-6')}>
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
            <p
              className={cn(
                'mt-3 font-semibold tracking-[-0.04em] text-foreground tabular-nums',
                emphasis ? 'text-4xl sm:text-[2.75rem]' : 'text-3xl',
              )}
            >
              {metric.value}
            </p>
          </div>
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-md border border-border bg-background/60 text-muted-foreground',
              emphasis ? 'size-11' : 'size-10',
            )}
          >
            <Icon className={cn(emphasis ? 'size-5' : 'size-4')} aria-hidden="true" />
          </div>
        </div>
        <div
          className={cn(
            'mt-5 flex items-center justify-between gap-3',
            emphasis && 'mt-7 border-t border-border pt-4',
          )}
        >
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-xs font-semibold',
              metric.trendDirection === 'up' &&
                'border-success/20 bg-success/10 text-success',
              metric.trendDirection === 'down' &&
                'border-destructive/20 bg-destructive/10 text-destructive',
              metric.trendDirection === 'flat' &&
                'border-border bg-muted/50 text-muted-foreground',
            )}
          >
            <TrendIcon className="size-3.5" aria-hidden="true" />
            {metric.trend}
          </div>
          <p className="min-w-0 truncate text-xs text-muted-foreground">{metric.note}</p>
        </div>
      </CardContent>
    </Card>
  );
}
