import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  const width = Math.max(8, Math.round((stage.count / Math.max(maxCount, 1)) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{stage.label}</span>
        <span className="text-sm text-muted-foreground tabular-nums">{stage.value}</span>
      </div>
      <div className="h-2 rounded-md bg-muted/80">
        <div
          className={cn('h-2 rounded-md', intentClasses[stage.intent])}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{stage.count}</span>{' '}
        leads
      </p>
    </div>
  );
}

export function PipelineCard({ stages }: PipelineCardProps) {
  const maxCount = Math.max(...stages.map((stage) => stage.count));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>Revenue movement by stage</CardTitle>
          <CardDescription>Pipeline health with archived leads retained.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage) => (
          <PipelineStage key={stage.status} stage={stage} maxCount={maxCount} />
        ))}
      </CardContent>
    </Card>
  );
}
