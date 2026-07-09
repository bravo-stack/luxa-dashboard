import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
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
    <Card
      className={cn(
        'card-lift',
        emphasis && 'border-primary/35 bg-primary/5 dark:bg-primary/10',
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-foreground tabular-nums">
              {metric.value}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-md border border-border bg-muted/45 text-muted-foreground">
            <Icon className="size-5" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold',
              metric.trendDirection === 'up' &&
                'border-success/25 bg-success/10 text-success',
              metric.trendDirection === 'down' &&
                'border-destructive/25 bg-destructive/10 text-destructive',
              metric.trendDirection === 'flat' &&
                'border-border bg-muted/50 text-muted-foreground',
            )}
          >
            <TrendIcon className="size-3.5" aria-hidden="true" />
            {metric.trend}
          </div>
          <p className="truncate text-xs text-muted-foreground">{metric.note}</p>
        </div>
      </CardContent>
    </Card>
  );
}
