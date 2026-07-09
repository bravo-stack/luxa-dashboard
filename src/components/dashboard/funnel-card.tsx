import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { FunnelStepSummary } from '@/lib/dashboard/types';

type FunnelCardProps = {
  steps: FunnelStepSummary[];
};

export function FunnelStep({ step, index }: { step: FunnelStepSummary; index: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_90px] sm:items-center">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-xs font-semibold text-primary tabular-nums">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-foreground">{step.label}</span>
        </div>
        <div className="mt-2 h-2 rounded-md bg-muted/80">
          <div
            className="h-2 rounded-md bg-primary"
            style={{ width: `${Math.min(100, step.rate)}%` }}
          />
        </div>
      </div>
      <span className="text-xl font-semibold text-foreground tabular-nums sm:text-right">
        {step.value.toLocaleString()}
      </span>
      <span className="rounded-md border border-success/25 bg-success/10 px-2.5 py-1 text-center text-xs font-semibold text-success">
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
        <p className="text-sm text-muted-foreground">Provider-neutral summary</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {steps.map((step, index) => (
          <FunnelStep key={step.key} step={step} index={index} />
        ))}
      </CardContent>
    </Card>
  );
}
