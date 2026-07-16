import { Badge } from '@/components/ui/badge';
import type { LeadStatus } from '@/lib/dashboard/types';
import { statusLabels } from '@/lib/dashboard/utils';
import { cn } from '@/lib/utils';

const statusClasses: Record<LeadStatus, string> = {
  new: 'border-primary/30 bg-primary/12 text-primary',
  contacted: 'border-muted-foreground/30 bg-muted-foreground/12 text-muted-foreground',
  qualified: 'border-warning/35 bg-warning/12 text-warning',
  won: 'border-success/35 bg-success/12 text-success',
  lost: 'border-destructive/35 bg-destructive/12 text-destructive',
  spam: 'border-border bg-muted/50 text-muted-foreground',
};

export function LeadStatusBadge({
  status,
  className,
}: {
  status: LeadStatus;
  className?: string;
}) {
  return (
    <Badge className={cn(statusClasses[status], className)}>{statusLabels[status]}</Badge>
  );
}
