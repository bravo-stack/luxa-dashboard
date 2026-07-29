import Link from 'next/link';
import { ArrowRight, BookOpenCheck, ChevronDown } from 'lucide-react';

import { LeadStatusBadge } from '@/components/leads/lead-status-badge';
import { Button } from '@/components/ui/button';
import type { LeadStatus } from '@/lib/dashboard/types';
import { getLeadStatusDefinition, leadStatusDefinitions } from '@/lib/sales/playbook';

export function LeadStatusGuide({ currentStatus }: { currentStatus?: LeadStatus }) {
  if (currentStatus) {
    const definition = getLeadStatusDefinition(currentStatus);

    return (
      <div className="rounded-md border border-border bg-muted/25 p-3">
        <p className="text-sm leading-6 text-foreground">{definition.summary}</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          <span className="font-semibold text-foreground">Next:</span>{' '}
          {definition.nextAction}
        </p>
        <Button
          asChild
          variant="ghost"
          className="mt-1 h-auto justify-start p-0 text-xs hover:bg-transparent"
        >
          <Link href="/dashboard/guide#lead-statuses">
            Open the status guide
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <details className="group surface-elevated overflow-hidden rounded-lg">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <BookOpenCheck className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">
              How lead statuses work
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Shared entry and exit criteria for a trustworthy pipeline
            </span>
          </span>
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-border px-5 py-5 sm:px-6">
        <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-3">
          {leadStatusDefinitions.map((definition) => (
            <div key={definition.status} className="bg-background p-4">
              <LeadStatusBadge status={definition.status} />
              <p className="mt-3 text-sm leading-6 text-foreground">
                {definition.summary}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {definition.exitCriteria}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button asChild variant="outline">
            <Link href="/dashboard/guide#lead-statuses">
              Read the complete sales guide
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </details>
  );
}
