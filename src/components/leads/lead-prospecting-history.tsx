import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  History,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { LeadProspectingHistory } from '@/lib/dashboard/types';
import { formatDate, formatDateTime } from '@/lib/dashboard/utils';

type LeadProspectingHistoryProps = {
  leadId: string;
  entries: LeadProspectingHistory[];
  page: number;
  total: number;
  totalPages: number;
};

const captureLabels: Record<LeadProspectingHistory['captureType'], string> = {
  created: 'Initial prospecting profile',
  updated: 'Prospecting profile updated',
  backfilled: 'Existing profile captured',
};

function ChannelLink({ href, label }: { href?: string; label: string }) {
  if (!href) return <span className="text-muted-foreground">Not captured</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
    >
      {label}
      <ArrowUpRight className="size-3.5" aria-hidden="true" />
    </a>
  );
}

function SnapshotField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm leading-6 font-medium break-words text-foreground">
        {value || 'Not captured'}
      </dd>
    </div>
  );
}

export function LeadProspectingHistory({
  leadId,
  entries,
  page,
  total,
  totalPages,
}: LeadProspectingHistoryProps) {
  return (
    <section className="surface-premium overflow-hidden rounded-lg">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <History className="size-4" aria-hidden="true" />
            <p className="text-xs font-semibold tracking-[0.08em] uppercase">
              Prospecting history
            </p>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Every saved context
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {total
              ? `${total} ${total === 1 ? 'snapshot' : 'snapshots'} retained for this account.`
              : 'New prospecting saves will appear here as an auditable timeline.'}
          </p>
        </div>
        {total > 0 ? (
          <p className="text-xs font-medium text-muted-foreground">
            Page {page} of {totalPages}
          </p>
        ) : null}
      </div>

      {entries.length ? (
        <ol className="divide-y divide-border">
          {entries.map((entry, index) => (
            <li key={entry.id} className="relative px-5 py-6 sm:px-6">
              <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-8">
                <div className="relative pl-7 lg:pl-0">
                  <span
                    className="absolute top-1.5 left-0 size-2.5 rounded-full bg-primary ring-4 ring-primary/10 lg:hidden"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-foreground">
                    {captureLabels[entry.captureType]}
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                    {formatDateTime(entry.created_at)}
                  </p>
                  {index === 0 && page === 1 ? (
                    <span className="mt-3 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide text-primary uppercase">
                      Latest saved
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {entry.focusName || 'No focus contact selected'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {entry.focusTitle || 'Title not captured'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-border bg-muted/45 px-2.5 py-1 text-xs font-medium text-foreground">
                        {entry.icpCategory || 'ICP not set'}
                      </span>
                      <span className="rounded-full border border-border bg-muted/45 px-2.5 py-1 text-xs font-medium text-foreground capitalize">
                        {entry.connectionStatus?.replace(/_/g, ' ') ||
                          'No connection state'}
                      </span>
                    </div>
                  </div>

                  <dl className="mt-5 grid gap-x-8 gap-y-5 border-t border-border pt-5 sm:grid-cols-2">
                    <SnapshotField
                      label="Next follow-up"
                      value={entry.nextFollowUpAction}
                    />
                    <SnapshotField
                      label="Last outreach"
                      value={
                        entry.lastOutreachDate
                          ? formatDate(entry.lastOutreachDate)
                          : undefined
                      }
                    />
                    <div className="sm:col-span-2">
                      <SnapshotField label="Pain points" value={entry.painPoints} />
                    </div>
                    <SnapshotField label="WhatsApp" value={entry.whatsapp} />
                    <SnapshotField label="Facebook" value={entry.facebookUrl} />
                    <div>
                      <dt className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                        Company LinkedIn
                      </dt>
                      <dd className="mt-1.5 text-sm leading-6">
                        <ChannelLink
                          href={entry.linkedinProfileUrl}
                          label="Open company"
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                        Focus LinkedIn
                      </dt>
                      <dd className="mt-1.5 text-sm leading-6">
                        <ChannelLink href={entry.focusLinkedinUrl} label="Open profile" />
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex items-start gap-4 px-5 py-8 sm:px-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarClock className="size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No saved history yet</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Save the prospecting profile to create the first retained snapshot.
            </p>
          </div>
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="Prospecting history pagination"
          className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:px-6"
        >
          {page > 1 ? (
            <Button asChild variant="ghost" size="sm">
              <Link
                href={`/dashboard/leads/${leadId}?historyPage=${page - 1}`}
                scroll={false}
              >
                <ArrowLeft aria-hidden="true" />
                Previous
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled>
              <ArrowLeft aria-hidden="true" />
              Previous
            </Button>
          )}
          <p className="text-xs font-medium text-muted-foreground">
            Showing {(page - 1) * 5 + 1}–{Math.min(page * 5, total)} of {total}
          </p>
          {page < totalPages ? (
            <Button asChild variant="ghost" size="sm">
              <Link
                href={`/dashboard/leads/${leadId}?historyPage=${page + 1}`}
                scroll={false}
              >
                Next
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled>
              Next
              <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </nav>
      ) : null}
    </section>
  );
}
