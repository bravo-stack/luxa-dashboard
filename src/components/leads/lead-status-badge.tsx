import { Badge } from '@/components/ui/badge';
import type { LeadStatus } from '@/lib/dashboard/types';
import { statusLabels } from '@/lib/dashboard/utils';
import { cn } from '@/lib/utils';

const statusClasses: Record<LeadStatus, string> = {
  new: 'border-primary/30 bg-primary/12 text-primary',
  qualified: 'border-accent-warm/35 bg-accent-warm/12 text-accent-warm',
  contacted: 'border-accent-violet/30 bg-accent-violet/12 text-accent-violet',
  scheduled: 'border-accent-teal/30 bg-accent-teal/12 text-accent-teal',
  proposal_ready: 'border-accent-warm/35 bg-accent-warm/12 text-accent-warm',
  won: 'border-accent-teal/35 bg-accent-teal/12 text-accent-teal',
  lost: 'border-destructive/35 bg-destructive/12 text-destructive',
  archived: 'border-border bg-white/3 text-muted-foreground',
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
