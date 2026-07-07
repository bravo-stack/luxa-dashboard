import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function LeadScoreBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const intent =
    score >= 88
      ? 'border-warning/35 bg-warning/12 text-warning'
      : score >= 72
        ? 'border-success/30 bg-success/12 text-success'
        : score >= 55
          ? 'border-primary/30 bg-primary/12 text-primary'
          : 'border-border bg-muted/50 text-muted-foreground';

  return <Badge className={cn('font-mono', intent, className)}>{score}</Badge>;
}
