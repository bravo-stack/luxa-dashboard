import { ArrowDown, LockKeyhole } from 'lucide-react';

import type { FunnelStepSummary } from '@/lib/dashboard/types';

type FunnelCardProps = {
  steps: FunnelStepSummary[];
};

export function FunnelStep({
  step,
  index,
  isLast,
}: {
  step: FunnelStepSummary;
  index: number;
  isLast: boolean;
}) {
  return (
    <li>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-[0.6875rem] font-semibold text-muted-foreground tabular-nums">
          {index + 1}
        </span>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-semibold text-foreground">
              {step.label}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {step.delta}
            </span>
          </div>
          <div className="mt-2 h-8 overflow-hidden rounded-md bg-muted/70">
            <div
              className="flex h-full items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-[width]"
              style={{ width: `${Math.max(8, Math.min(100, step.rate))}%` }}
            >
              <span className="truncate">{step.rate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        <span className="min-w-14 text-right text-xl font-semibold tracking-[-0.03em] text-foreground tabular-nums">
          {step.value.toLocaleString()}
        </span>
      </div>
      {!isLast ? (
        <div className="ml-3.5 flex h-7 items-center border-l border-dashed border-border pl-4 text-muted-foreground">
          <ArrowDown className="size-3.5 -translate-x-[1.2rem]" aria-hidden="true" />
        </div>
      ) : null}
    </li>
  );
}

export function FunnelCard({ steps }: FunnelCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
        <div>
          <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
            Ordered conversion
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Intent funnel
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Anonymous visitors completing each step in sequence.
          </p>
        </div>
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground"
          title="Privacy-safe anonymous funnel"
        >
          <LockKeyhole className="size-4" aria-hidden="true" />
        </div>
      </div>
      <div className="p-5">
        {steps.length ? (
          <ol>
            {steps.map((step, index) => (
              <FunnelStep
                key={step.key}
                step={step}
                index={index}
                isLast={index === steps.length - 1}
              />
            ))}
          </ol>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-sm leading-6 text-muted-foreground">
            The ordered funnel will populate after visitors begin the form.
          </div>
        )}
      </div>
    </section>
  );
}
