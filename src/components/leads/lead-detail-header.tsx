import Link from 'next/link';
import { ArrowLeft, ExternalLink, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Lead, LeadOwner } from '@/lib/dashboard/types';
import { formatDate } from '@/lib/dashboard/utils';

import { LeadScoreBadge } from './lead-score-badge';
import { LeadStatusBadge } from './lead-status-badge';

type LeadDetailHeaderProps = {
  lead: Lead;
  owner?: LeadOwner;
};

export function LeadDetailHeader({ lead, owner }: LeadDetailHeaderProps) {
  return (
    <header className="surface-liquid-glass gradient-border-panel rounded-3xl p-5 sm:p-7">
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
            <LeadScoreBadge score={lead.qualification_score} />
            <span className="rounded-full border border-border bg-white/3 px-2.5 py-1 text-xs text-muted-foreground">
              Created {formatDate(lead.created_at)}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">
            {lead.company}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {lead.name} leads this opportunity
            {owner ? ` with ${owner.name} assigned` : ' with no owner assigned'}.
          </p>
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
