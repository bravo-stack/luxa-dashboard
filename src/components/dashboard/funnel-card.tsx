import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { FunnelStepSummary } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

type FunnelCardProps = {
  steps: FunnelStepSummary[];
};

export function FunnelStep({ step, index }: { step: FunnelStepSummary; index: number }) {
  return (
    <div className="grid gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_110px_90px] sm:items-center">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-sm border border-border bg-muted/50 text-xs font-semibold text-muted-foreground tabular-nums">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-foreground">{step.label}</span>
        </div>
        <div className="mt-3 h-2 rounded-sm bg-muted/80">
          <div
            className="h-2 rounded-sm bg-primary"
            style={{ width: `${Math.min(100, step.rate)}%` }}
          />
        </div>
      </div>
      <span className="text-xl font-semibold text-foreground tabular-nums sm:text-right">
        {step.value.toLocaleString()}
      </span>
      <span
        className={cn(
          'rounded-sm border px-2.5 py-1 text-center text-xs font-semibold',
          step.delta.startsWith('-')
            ? 'border-destructive/20 bg-destructive/10 text-destructive'
            : 'border-success/20 bg-success/10 text-success',
        )}
      >
        {step.delta}
      </span>
    </div>
  );
}

export function FunnelCard({ steps }: FunnelCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>Behavior to booked intent</CardTitle>
          <CardDescription>Funnel performance across the selected range.</CardDescription>
        </div>
        <p className="text-sm text-muted-foreground">Provider-neutral</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.length ? (
          steps.map((step, index) => (
            <FunnelStep key={step.key} step={step} index={index} />
          ))
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-sm leading-6 text-muted-foreground">
            No conversion data yet. Once visitors begin completing the audit form, this
            chart will show step completion and drop-off.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
