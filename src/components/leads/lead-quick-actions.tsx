'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Copy, ExternalLink, ShieldAlert, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deleteLead, persistLeadStatus } from '@/lib/dashboard/client';
import {
  type AuditSubmission,
  type Lead,
  type LeadStatus,
  leadStatuses,
} from '@/lib/dashboard/types';
import { formatDate, originLabels, statusLabels } from '@/lib/dashboard/utils';

import { LeadStatusBadge } from './lead-status-badge';

type LeadQuickActionsProps = {
  lead: Lead;
  latestSubmission?: AuditSubmission;
};

export function LeadQuickActions({ lead, latestSubmission }: LeadQuickActionsProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<LeadStatus>(lead.status);
  const [mutationError, setMutationError] = React.useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function saveStatus(nextStatus: LeadStatus) {
    const previousStatus = status;

    if (previousStatus === nextStatus) {
      return;
    }

    setMutationError('');
    setStatus(nextStatus);
    startTransition(async () => {
      try {
        await persistLeadStatus(lead.id, nextStatus);
        router.refresh();
      } catch (error: unknown) {
        setStatus(previousStatus);
        setMutationError('The lead status could not be saved. Try again.');
        console.error(error);
      }
    });
  }

  function removeLead() {
    setMutationError('');
    startTransition(async () => {
      try {
        await deleteLead(lead.id);
        router.replace('/dashboard/leads');
        router.refresh();
      } catch (error: unknown) {
        setMutationError('The lead could not be deleted. Try again.');
        console.error(error);
      }
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
            <span className="text-muted-foreground">Origin</span>
            <span className="text-right font-semibold text-foreground">
              {originLabels[lead.origin]}
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
            onClick={() => saveStatus('contacted')}
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
              disabled={isPending}
              onValueChange={(value) => {
                saveStatus(value as LeadStatus);
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
            onClick={() => saveStatus('spam')}
          >
            <ShieldAlert className="size-4" />
            Mark as spam
          </Button>
          {mutationError ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {mutationError}
            </p>
          ) : null}
        </div>
      </section>
      <section className="rounded-lg border border-destructive/20 bg-destructive/5 p-5">
        <p className="text-xs font-semibold tracking-[0.08em] text-destructive uppercase">
          Danger zone
        </p>
        {isConfirmingDelete ? (
          <div className="mt-3">
            <p className="text-sm font-semibold text-foreground">Delete this lead?</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              The lead, its submitted context, notes, and prospecting history will be
              permanently removed.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => setIsConfirmingDelete(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={removeLead}
              >
                <Trash2 aria-hidden="true" />
                {isPending ? 'Deleting' : 'Delete permanently'}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="mt-3 w-full justify-start text-destructive hover:text-destructive"
            disabled={isPending}
            onClick={() => setIsConfirmingDelete(true)}
          >
            <Trash2 aria-hidden="true" />
            Delete lead
          </Button>
        )}
      </section>
    </aside>
  );
}
