'use client';

import * as React from 'react';
import { CheckCircle2, Copy, ExternalLink, ShieldAlert } from 'lucide-react';

import {
  markLeadContacted,
  markLeadSpam,
  updateLeadStatus,
} from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type AuditSubmission,
  type Lead,
  type LeadStatus,
  leadStatuses,
} from '@/lib/dashboard/types';
import { formatDate, statusLabels } from '@/lib/dashboard/utils';

import { LeadStatusBadge } from './lead-status-badge';

type LeadQuickActionsProps = {
  lead: Lead;
  latestSubmission?: AuditSubmission;
};

export function LeadQuickActions({ lead, latestSubmission }: LeadQuickActionsProps) {
  const [status, setStatus] = React.useState<LeadStatus>(lead.status);
  const [isPending, startTransition] = React.useTransition();

  function runAction(action: () => Promise<unknown>) {
    startTransition(() => {
      action().catch((error: unknown) => console.error(error));
    });
  }

  return (
    <aside className="space-y-4">
      <section className="surface-premium rounded-lg p-5">
        <p className="text-xs font-semibold text-primary uppercase">Status card</p>
        <div className="mt-4 flex items-center gap-3">
          <LeadStatusBadge status={status} />
        </div>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <span className="text-muted-foreground">Budget range</span>
            <span className="text-right font-semibold text-foreground">
              {latestSubmission?.budget_range ?? 'Not captured'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <span className="text-muted-foreground">Timeline</span>
            <span className="text-right font-semibold text-foreground">
              {latestSubmission?.timeline ?? 'Not captured'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <span className="text-muted-foreground">Source</span>
            <span className="text-right font-semibold text-foreground">
              {lead.source}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <span className="text-muted-foreground">Locale</span>
            <span className="text-right font-semibold text-foreground">
              {lead.locale.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Created</span>
            <span className="text-right font-semibold text-foreground">
              {formatDate(lead.created_at)}
            </span>
          </div>
        </div>
      </section>
      <section className="surface-elevated rounded-lg p-5">
        <p className="text-xs font-semibold text-success uppercase">Quick actions</p>
        <div className="mt-4 space-y-3">
          <Button
            className="w-full justify-start"
            variant="secondary"
            disabled={isPending}
            onClick={() => runAction(() => markLeadContacted(lead.id))}
          >
            <CheckCircle2 className="size-4" />
            Mark contacted
          </Button>
          <Button
            className="w-full justify-start"
            variant="secondary"
            onClick={() =>
              navigator.clipboard
                .writeText(lead.email)
                .catch((error: unknown) => console.error(error))
            }
          >
            <Copy className="size-4" />
            Copy email
          </Button>
          {lead.website ? (
            <Button asChild className="w-full justify-start" variant="secondary">
              <a href={lead.website} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Open website
              </a>
            </Button>
          ) : null}
          <div className="space-y-2">
            <label
              className="text-xs font-semibold text-muted-foreground uppercase"
              htmlFor="lead-status"
            >
              Change status
            </label>
            <Select
              value={status}
              onValueChange={(value) => {
                const nextStatus = value as LeadStatus;
                setStatus(nextStatus);
                runAction(() => updateLeadStatus(lead.id, nextStatus));
              }}
            >
              <SelectTrigger id="lead-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leadStatuses.map((item) => (
                  <SelectItem key={item} value={item}>
                    {statusLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full justify-start"
            variant="destructive"
            disabled={isPending}
            onClick={() => runAction(() => markLeadSpam(lead.id))}
          >
            <ShieldAlert className="size-4" />
            Mark as spam
          </Button>
        </div>
      </section>
    </aside>
  );
}
