import Link from 'next/link';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

import { PriorityBadge } from '@/components/leads/priority-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NeedsAttentionItem } from '@/lib/dashboard/types';

type NeedsAttentionProps = {
  items: NeedsAttentionItem[];
};

export function NeedsAttention({ items }: NeedsAttentionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Follow-up control</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Queues that need owner review or next-step discipline.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard/leads">Open queue</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-muted/35 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-warning/25 bg-warning/10 text-warning">
                  <AlertCircle className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{item.label}</h3>
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              <span className="text-2xl font-semibold text-foreground tabular-nums">
                {item.count}
              </span>
            </div>
            {item.leadIds[0] ? (
              <Link
                href={`/dashboard/leads/${item.leadIds[0]}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
              >
                Review next
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
