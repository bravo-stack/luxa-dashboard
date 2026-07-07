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
      ? 'border-accent-warm/35 bg-accent-warm/12 text-accent-warm'
      : score >= 72
        ? 'border-accent-teal/30 bg-accent-teal/12 text-accent-teal'
        : score >= 55
          ? 'border-primary/30 bg-primary/12 text-primary'
          : 'border-border bg-muted/50 text-muted-foreground';

  return <Badge className={cn('font-mono', intent, className)}>{score}</Badge>;
}
