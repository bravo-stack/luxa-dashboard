import Link from 'next/link';
import { ArrowLeft, ExternalLink, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Lead } from '@/lib/dashboard/types';
import { formatDate } from '@/lib/dashboard/utils';

import { LeadStatusBadge } from './lead-status-badge';

type LeadDetailHeaderProps = {
  lead: Lead;
};

export function LeadDetailHeader({ lead }: LeadDetailHeaderProps) {
  const provenance =
    lead.origin === 'website'
      ? `${lead.name} submitted from ${lead.pathname} in ${lead.locale.toUpperCase()}.`
      : lead.origin === 'manual'
        ? `${lead.name} was added manually by a team member.`
        : `${lead.name} entered the CRM through an ${lead.origin} workflow.`;

  return (
    <header className="surface-premium rounded-lg border-primary/30 p-5 sm:p-7">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/dashboard/leads">
          <ArrowLeft className="size-4" />
          Back to leads
        </Link>
      </Button>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <LeadStatusBadge status={lead.status} />
            <span className="rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
              Created {formatDate(lead.created_at)}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">
            {lead.company}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">{provenance}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <a href={`mailto:${lead.email}`}>
              <Mail className="size-4" />
              Email lead
            </a>
          </Button>
          {lead.website ? (
            <Button asChild>
              <a href={lead.website} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Open website
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
