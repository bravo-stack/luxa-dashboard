'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Trash2,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  claimLead,
  persistLeadStatus,
  requestLeadDeletion,
} from '@/lib/dashboard/client';
import {
  type AuditSubmission,
  type Lead,
  type LeadDeletionRequest,
  type LeadStatus,
  leadStatuses,
} from '@/lib/dashboard/types';
import { formatDate, originLabels, statusLabels } from '@/lib/dashboard/utils';

import { LeadOwnerSelect } from './lead-owner-select';
import { LeadStatusBadge } from './lead-status-badge';
import { LeadStatusGuide } from './lead-status-guide';

type LeadQuickActionsProps = {
  lead: Lead;
  latestSubmission?: AuditSubmission;
  canEdit?: boolean;
  canClaim?: boolean;
  canRequestDeletion?: boolean;
  deletionRequest?: LeadDeletionRequest | null;
  assignmentMembers?: Array<{
    id: string;
    displayName: string;
    email: string;
  }>;
};

export function LeadQuickActions({
  lead,
  latestSubmission,
  canEdit = true,
  canClaim = false,
  canRequestDeletion = false,
  deletionRequest,
  assignmentMembers,
}: LeadQuickActionsProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<LeadStatus>(lead.status);
  const [mutationError, setMutationError] = React.useState('');
  const [isMarkingSpam, setIsMarkingSpam] = React.useState(false);
  const [spamReason, setSpamReason] = React.useState('');
  const [isRequestingDeletion, setIsRequestingDeletion] = React.useState(false);
  const [deletionReason, setDeletionReason] = React.useState('');
  const [isPending, startTransition] = React.useTransition();

  function runMutation(
    action: () => Promise<void>,
    onSuccess?: () => void,
    onError?: () => void,
  ) {
    setMutationError('');
    startTransition(async () => {
      try {
        await action();
        onSuccess?.();
        router.refresh();
      } catch (error: unknown) {
        onError?.();
        setMutationError(
          error instanceof Error ? error.message : 'The change could not be saved.',
        );
      }
    });
  }

  function saveStatus(nextStatus: LeadStatus, outcomeReason?: string) {
    const previousStatus = status;

    if (previousStatus === nextStatus) return;
    if (
      ['won', 'lost', 'spam'].includes(nextStatus) &&
      !outcomeReason?.trim() &&
      !lead.outcomeReason?.trim()
    ) {
      setMutationError(
        'Add an outcome or disqualification reason before closing this lead.',
      );
      return;
    }

    setStatus(nextStatus);
    runMutation(
      () => persistLeadStatus(lead.id, nextStatus, outcomeReason),
      () => {
        setIsMarkingSpam(false);
        setSpamReason('');
      },
      () => setStatus(previousStatus),
    );
  }

  function handleClaim() {
    runMutation(() => claimLead(lead.id));
  }

  function handleDeletionRequest() {
    const reason = deletionReason.trim();

    if (reason.length < 10) {
      setMutationError(
        'Explain why this lead should be deleted in at least 10 characters.',
      );
      return;
    }

    runMutation(
      () => requestLeadDeletion(lead.id, reason),
      () => {
        setIsRequestingDeletion(false);
        setDeletionReason('');
      },
    );
  }

  return (
    <aside className="space-y-4">
      {canClaim ? (
        <section className="rounded-lg border border-primary/25 bg-primary/5 p-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-primary uppercase">
            Shared funnel lead
          </p>
          <h2 className="mt-2 text-base font-semibold text-foreground">
            Claim before contacting
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Claiming makes you the owner and unlocks status changes, notes, and record
            editing. If another rep claims first, this record will stay read-only.
          </p>
          <Button className="mt-4 w-full" disabled={isPending} onClick={handleClaim}>
            {isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <UserPlus aria-hidden="true" />
            )}
            {isPending ? 'Claiming lead' : 'Claim this lead'}
          </Button>
        </section>
      ) : null}
      {mutationError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive"
        >
          {mutationError}
        </p>
      ) : null}

      <section className="surface-premium rounded-lg p-5">
        <p className="text-xs font-semibold text-primary uppercase">Status card</p>
        <div className="mt-4 flex items-center gap-3">
          <LeadStatusBadge status={status} />
        </div>
        <div className="mt-5 space-y-3 text-sm">
          <StatusLine label="Budget range" value={latestSubmission?.budget_range} />
          <StatusLine label="Timeline" value={latestSubmission?.timeline} />
          <StatusLine label="Origin" value={originLabels[lead.origin]} />
          <StatusLine label="Locale" value={lead.locale.toUpperCase()} />
          <StatusLine label="Created" value={formatDate(lead.created_at)} last />
        </div>
      </section>

      <section className="surface-elevated rounded-lg p-5">
        <p className="text-xs font-semibold text-success uppercase">Quick actions</p>
        <div className="mt-4 space-y-3">
          {canEdit ? (
            <Button
              className="w-full justify-start"
              variant="secondary"
              disabled={isPending || status === 'contacted'}
              onClick={() => saveStatus('contacted')}
            >
              <CheckCircle2 className="size-4" />
              Mark contacted
            </Button>
          ) : null}
          <Button
            className="w-full justify-start"
            variant="secondary"
            onClick={() =>
              navigator.clipboard
                .writeText(lead.email)
                .catch(() => setMutationError('The email could not be copied.'))
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
          {canEdit ? (
            <>
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
                  onValueChange={(value) => saveStatus(value as LeadStatus)}
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
                <LeadStatusGuide currentStatus={status} />
              </div>
              {isMarkingSpam ? (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                  <label
                    htmlFor="spam-reason"
                    className="text-xs font-semibold text-foreground"
                  >
                    Why is this spam?
                  </label>
                  <Textarea
                    id="spam-reason"
                    value={spamReason}
                    maxLength={1000}
                    className="mt-2 min-h-24 bg-background"
                    placeholder="For example: automated solicitation unrelated to Luxa services"
                    onChange={(event) => setSpamReason(event.target.value)}
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setIsMarkingSpam(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending || spamReason.trim().length < 10}
                      onClick={() => saveStatus('spam', spamReason.trim())}
                    >
                      <ShieldAlert aria-hidden="true" />
                      Confirm spam
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isPending || status === 'spam'}
                  onClick={() => setIsMarkingSpam(true)}
                >
                  <ShieldAlert className="size-4" />
                  Mark as spam
                </Button>
              )}
            </>
          ) : null}
        </div>
      </section>

      {assignmentMembers ? (
        <section className="surface-elevated rounded-lg p-5">
          <p className="mb-4 text-xs font-semibold text-primary uppercase">Ownership</p>
          <LeadOwnerSelect
            leadId={lead.id}
            currentOwnerId={lead.owner_user_id}
            members={assignmentMembers}
          />
        </section>
      ) : null}

      {canRequestDeletion ? (
        <section className="rounded-lg border border-border bg-muted/20 p-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Controlled deletion
          </p>
          {deletionRequest?.status === 'pending' ? (
            <div className="mt-3 flex gap-3">
              <Clock3
                className="mt-0.5 size-4 shrink-0 text-warning"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Awaiting admin review
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Requested {formatDate(deletionRequest.requestedAt)}. The lead remains
                  available until an administrator approves deletion.
                </p>
              </div>
            </div>
          ) : isRequestingDeletion ? (
            <div className="mt-3">
              <label htmlFor="deletion-reason" className="text-sm font-semibold">
                Why should this record be permanently deleted?
              </label>
              <Textarea
                id="deletion-reason"
                value={deletionReason}
                maxLength={1000}
                className="mt-2 min-h-28 bg-background"
                placeholder="Describe the duplicate, consent, data-quality, or other reason."
                onChange={(event) => setDeletionReason(event.target.value)}
              />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Marking spam does not delete a record. Permanent deletion removes the lead
                and its related CRM history after approval.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setIsRequestingDeletion(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending || deletionReason.trim().length < 10}
                  onClick={handleDeletionRequest}
                >
                  {isPending ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 aria-hidden="true" />
                  )}
                  {isPending ? 'Submitting' : 'Submit for review'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {deletionRequest?.status === 'rejected' ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  The previous request was declined
                  {deletionRequest.reviewNote ? `: ${deletionRequest.reviewNote}` : '.'}
                </p>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                className="mt-3 w-full justify-start text-destructive hover:text-destructive"
                disabled={isPending}
                onClick={() => setIsRequestingDeletion(true)}
              >
                <Trash2 aria-hidden="true" />
                Request deletion
              </Button>
            </>
          )}
        </section>
      ) : null}
    </aside>
  );
}

function StatusLine({
  label,
  value,
  last = false,
}: {
  label: string;
  value?: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 pb-3 ${
        last ? '' : 'border-b border-border'
      }`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">
        {value || 'Not captured'}
      </span>
    </div>
  );
}
