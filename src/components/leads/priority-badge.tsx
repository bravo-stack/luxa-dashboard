import { Badge } from '@/components/ui/badge';
import type { LeadPriority } from '@/lib/dashboard/types';
import { priorityLabels } from '@/lib/dashboard/utils';
import { cn } from '@/lib/utils';

const priorityClasses: Record<LeadPriority, string> = {
  standard: 'border-border bg-muted/50 text-muted-foreground',
  review_next: 'border-primary/30 bg-primary/12 text-primary',
  contact_overdue: 'border-destructive/35 bg-destructive/12 text-destructive',
  high_fit: 'border-warning/35 bg-warning/12 text-warning',
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: LeadPriority;
  className?: string;
}) {
  return (
    <Badge className={cn(priorityClasses[priority], className)}>
      {priorityLabels[priority]}
    </Badge>
  );
}
