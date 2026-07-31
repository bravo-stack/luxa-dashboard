'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldX,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { reviewLeadDeletion } from '@/lib/dashboard/client';
import type { LeadDeletionRequest } from '@/lib/dashboard/types';
import { formatDateTime } from '@/lib/dashboard/utils';

const statusConfig = {
  pending: { label: 'Pending review', icon: Clock3, className: 'text-warning' },
  approved: { label: 'Approved', icon: CheckCircle2, className: 'text-success' },
  rejected: { label: 'Rejected', icon: ShieldX, className: 'text-muted-foreground' },
} as const;

export function LeadDeletionReviewList({
  requests,
  canManage,
}: {
  requests: LeadDeletionRequest[];
  canManage: boolean;
}) {
  if (!requests.length) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
        <CheckCircle2 className="mx-auto size-6 text-success" aria-hidden="true" />
        <h2 className="mt-4 text-base font-semibold text-foreground">
          Nothing waiting in this view
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Deletion requests will appear here with their reason and requester preserved for
          review.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {requests.map((request) => {
        const config = statusConfig[request.status];
        const StatusIcon = config.icon;

        return (
          <article
            key={request.id}
            className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-[0_14px_40px_rgba(18,24,40,0.035)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${config.className}`}
                >
                  <StatusIcon className="size-3.5" aria-hidden="true" />
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(request.requestedAt)}
                </span>
              </div>
              <h2 className="mt-2 truncate text-base font-semibold text-foreground">
                {request.leadName} · {request.leadCompany}
              </h2>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {request.leadEmail}
              </p>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-foreground">
                {request.reason}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Requested by {request.requestedByName}
                {request.reviewedByName ? ` · Reviewed by ${request.reviewedByName}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              {request.leadId ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/dashboard/leads/${request.leadId}`}>
                    Open lead
                    <ArrowUpRight aria-hidden="true" />
                  </Link>
                </Button>
              ) : null}
              <DeletionReviewSheet request={request} disabled={!canManage} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function DeletionReviewSheet({
  request,
  disabled,
}: {
  request: LeadDeletionRequest;
  disabled: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState(request.reviewNote ?? '');
  const [error, setError] = React.useState('');
  const [isPending, startTransition] = React.useTransition();
  const isReviewable = request.status === 'pending' && !disabled;

  function review(decision: 'approved' | 'rejected') {
    if (decision === 'rejected' && note.trim().length < 5) {
      setError('Add a short reason so the requester understands the decision.');
      return;
    }

    setError('');
    startTransition(async () => {
      try {
        await reviewLeadDeletion(request.id, decision, note.trim());
        setOpen(false);
        router.refresh();
      } catch (reviewError: unknown) {
        setError(
          reviewError instanceof Error
            ? reviewError.message
            : 'The review could not be saved.',
        );
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={request.status === 'pending' ? 'secondary' : 'ghost'} size="sm">
          {request.status === 'pending' ? 'Review request' : 'View decision'}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto p-6 sm:p-7">
        <SheetTitle className="pr-10 text-xl font-semibold text-foreground">
          Deletion review
        </SheetTitle>
        <SheetDescription className="mt-2 text-sm leading-6 text-muted-foreground">
          Confirm that permanent removal is justified and that marking spam or correcting
          the record would not solve the issue.
        </SheetDescription>

        <dl className="mt-7 divide-y divide-border border-y border-border text-sm">
          <ReviewLine label="Lead" value={request.leadName} />
          <ReviewLine label="Company" value={request.leadCompany} />
          <ReviewLine label="Email" value={request.leadEmail} />
          <ReviewLine label="Requested by" value={request.requestedByName} />
          <ReviewLine label="Requested" value={formatDateTime(request.requestedAt)} />
        </dl>

        <div className="mt-6">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Request reason
          </p>
          <p className="mt-2 text-sm leading-7 whitespace-pre-wrap text-foreground">
            {request.reason}
          </p>
        </div>

        {isReviewable ? (
          <div className="mt-7">
            <label
              htmlFor={`review-note-${request.id}`}
              className="text-sm font-semibold"
            >
              Review note
            </label>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Required when rejecting. Optional when approving.
            </p>
            <Textarea
              id={`review-note-${request.id}`}
              value={note}
              maxLength={1000}
              className="mt-3 min-h-28"
              placeholder="Record the basis for this decision"
              onChange={(event) => setNote(event.target.value)}
            />
            {error ? (
              <p role="alert" className="mt-3 text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => review('rejected')}
              >
                <ShieldX aria-hidden="true" />
                Reject request
              </Button>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => review('approved')}
              >
                {isPending ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 aria-hidden="true" />
                )}
                Approve deletion
              </Button>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Approval permanently removes the live lead and its related CRM history. The
              request and decision record remain for audit purposes.
            </p>
          </div>
        ) : (
          <div className="mt-7 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-semibold text-foreground">
              {statusConfig[request.status].label}
            </p>
            {request.reviewNote ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {request.reviewNote}
              </p>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium break-words text-foreground">{value}</dd>
    </div>
  );
}
