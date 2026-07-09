import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type InsightCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  tone?: 'primary' | 'neutral' | 'success' | 'warning';
};

const toneClasses = {
  primary: 'border-primary/25 bg-primary/10 text-primary',
  neutral: 'border-border bg-muted text-muted-foreground',
  success: 'border-success/25 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
};

export function InsightCard({
  title,
  value,
  description,
  icon: Icon,
  tone = 'primary',
}: InsightCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-md border',
              toneClasses[tone],
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </div>
          <span className="text-2xl font-semibold text-foreground tabular-nums">
            {value}
          </span>
        </div>
        <h3 className="mt-5 text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
