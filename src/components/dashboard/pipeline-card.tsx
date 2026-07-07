import type { PipelineStageSummary } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

type PipelineCardProps = {
  stages: PipelineStageSummary[];
};

const intentClasses: Record<PipelineStageSummary['intent'], string> = {
  neutral: 'bg-white/12 text-muted-foreground',
  primary: 'bg-primary text-primary-foreground',
  violet: 'bg-accent-violet text-background',
  teal: 'bg-accent-teal text-background',
  warm: 'bg-accent-warm text-background',
  destructive: 'bg-destructive text-destructive-foreground',
};

export function PipelineStage({
  stage,
  maxCount,
}: {
  stage: PipelineStageSummary;
  maxCount: number;
}) {
  const width = Math.max(8, Math.round((stage.count / Math.max(maxCount, 1)) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{stage.label}</span>
        <span className="font-mono text-sm text-muted-foreground">{stage.value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/6">
        <div
          className={cn('h-2 rounded-full', intentClasses[stage.intent])}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-mono text-foreground">{stage.count}</span> leads
      </p>
    </div>
  );
}

export function PipelineCard({ stages }: PipelineCardProps) {
  const maxCount = Math.max(...stages.map((stage) => stage.count));

  return (
    <section className="surface-premium rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase">Pipeline health</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Revenue movement by stage
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Archived leads stay visible for operational context.
        </p>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage) => (
          <PipelineStage key={stage.status} stage={stage} maxCount={maxCount} />
        ))}
      </div>
    </section>
  );
}
