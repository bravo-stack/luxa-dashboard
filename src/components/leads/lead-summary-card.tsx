import { Building2, Globe2, Mail, UserRound } from 'lucide-react';

import type { AuditSubmission, Lead } from '@/lib/dashboard/types';
import { getLeadOwnershipLabel, originLabels } from '@/lib/dashboard/utils';

type LeadSummaryCardProps = {
  lead: Lead;
  latestSubmission?: AuditSubmission;
};

function SummaryLine({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/45 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function LeadSummaryCard({ lead, latestSubmission }: LeadSummaryCardProps) {
  return (
    <section className="surface-premium rounded-lg p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold text-primary uppercase">Lead summary</p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">Account context</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Provenance, ownership, and contact state for the current sales motion.
        </p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <SummaryLine label="Lead" value={lead.name} icon={UserRound} />
        <SummaryLine label="Company" value={lead.company} icon={Building2} />
        <SummaryLine label="Email" value={lead.email} icon={Mail} />
        <SummaryLine
          label="Website"
          value={lead.website ?? 'Not captured'}
          icon={Globe2}
        />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border bg-muted/45 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Origin</p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {originLabels[lead.origin]}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/45 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            Ownership
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {getLeadOwnershipLabel(lead)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/45 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Locale</p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {lead.locale.toUpperCase()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/45 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            {lead.origin === 'website' ? 'Landing path' : 'Marketing source'}
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {lead.origin === 'website'
              ? lead.pathname
              : (lead.marketingSource ?? 'Not applicable')}
          </p>
        </div>
      </div>
      {latestSubmission ? (
        <div className="mt-5 rounded-lg border border-primary/20 bg-primary/10 p-4">
          <p className="text-xs font-semibold text-primary uppercase">
            Latest submission
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {latestSubmission.project_type}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {latestSubmission.budget_range} / {latestSubmission.timeline}
          </p>
        </div>
      ) : null}
    </section>
  );
}
