import Link from 'next/link';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

import { PriorityBadge } from '@/components/leads/priority-badge';
import { Button } from '@/components/ui/button';
import type { NeedsAttentionItem } from '@/lib/dashboard/types';

type NeedsAttentionProps = {
  items: NeedsAttentionItem[];
};

export function NeedsAttention({ items }: NeedsAttentionProps) {
  return (
    <section className="surface-premium rounded-3xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-accent-warm uppercase">
            Needs attention
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Follow-up control
          </h2>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard/leads">Open queue</Link>
        </Button>
      </div>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border bg-white/2.5 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl border border-accent-warm/25 bg-accent-warm/10 text-accent-warm">
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
              <span className="font-mono text-2xl font-semibold text-foreground">
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
      </div>
    </section>
  );
}
