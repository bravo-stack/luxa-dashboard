import type { PipelineStageSummary } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

type PipelineCardProps = {
  stages: PipelineStageSummary[];
};

const intentClasses: Record<PipelineStageSummary['intent'], string> = {
  neutral: 'bg-muted-foreground/40',
  primary: 'bg-primary',
  violet: 'bg-primary',
  teal: 'bg-success',
  warm: 'bg-warning',
  destructive: 'bg-destructive',
};

export function PipelineStage({
  stage,
  maxCount,
}: {
  stage: PipelineStageSummary;
  maxCount: number;
}) {
  const width =
    stage.count === 0
      ? 0
      : Math.max(4, Math.round((stage.count / Math.max(maxCount, 1)) * 100));

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn('size-2 shrink-0 rounded-full', intentClasses[stage.intent])}
          aria-hidden="true"
        />
        <span className="truncate text-sm font-semibold text-foreground">
          {stage.label}
        </span>
      </div>
      <span className="text-sm font-semibold text-foreground tabular-nums">
        {stage.count.toLocaleString()}
      </span>
      <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full', intentClasses[stage.intent])}
          style={{ width: `${width}%` }}
        />
      </div>
    </li>
  );
}

export function PipelineCard({ stages }: PipelineCardProps) {
  const maxCount = Math.max(...stages.map((stage) => stage.count), 0);
  const total = stages.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-end justify-between gap-4 border-b border-border px-5 py-5">
        <div>
          <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
            CRM distribution
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Pipeline movement
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Live lead volume by operating stage.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-[-0.04em] text-foreground tabular-nums">
            {total.toLocaleString()}
          </p>
          <p className="text-[0.6875rem] text-muted-foreground">Total records</p>
        </div>
      </div>
      <ol className="space-y-5 p-5">
        {stages.map((stage) => (
          <PipelineStage key={stage.status} stage={stage} maxCount={maxCount} />
        ))}
      </ol>
    </section>
  );
}
