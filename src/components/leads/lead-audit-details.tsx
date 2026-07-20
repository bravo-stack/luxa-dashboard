'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';

import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';
import type { AuditSubmission } from '@/lib/dashboard/types';
import { formatDateTime } from '@/lib/dashboard/utils';

type LeadAuditDetailsProps = {
  submissions: AuditSubmission[];
};

const PAGE_SIZE = 3;

function SubmissionField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm leading-6 whitespace-pre-wrap text-foreground">
        {value || 'Not captured'}
      </dd>
    </div>
  );
}

function getSubmissionLabel(submission: AuditSubmission) {
  if (submission.submission_type === 'platform_audit') return 'Platform audit';
  if (submission.submission_type === 'quick_start') return 'Quick-start';
  return 'Manual CRM context';
}

export function LeadAuditDetails({ submissions }: LeadAuditDetailsProps) {
  const [page, setPage] = useState(1);

  if (!submissions.length) {
    return (
      <EmptyState
        icon={FileText}
        title="No audit submission yet"
        description="When the lead completes a quick-start or platform audit, the operational context will appear here."
      />
    );
  }

  const totalPages = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleSubmissions = submissions.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <section className="surface-elevated overflow-hidden rounded-lg">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Submitted context
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Complete intake record
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Every captured answer is preserved—current and historical.
          </p>
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
        </p>
      </div>

      <div className="divide-y divide-border">
        {visibleSubmissions.map((submission, index) => {
          const absoluteIndex = (safePage - 1) * PAGE_SIZE + index;

          return (
            <article key={submission.id} className="px-5 py-7 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold tracking-[0.08em] text-primary uppercase">
                      {getSubmissionLabel(submission)}
                    </span>
                    {absoluteIndex === 0 ? (
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-primary uppercase">
                        Latest
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">
                    {submission.project_type || 'Untitled opportunity'}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {formatDateTime(submission.created_at)} · {submission.source}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-border bg-muted/45 px-2.5 py-1 text-xs font-medium text-foreground">
                    {submission.industry_segment || 'Industry not captured'}
                  </span>
                  <span className="rounded-full border border-border bg-muted/45 px-2.5 py-1 text-xs font-medium text-foreground">
                    {submission.budget_range || 'Budget not captured'}
                  </span>
                  <span className="rounded-full border border-border bg-muted/45 px-2.5 py-1 text-xs font-medium text-foreground">
                    {submission.timeline || 'Timeline not captured'}
                  </span>
                </div>
              </div>

              <dl className="mt-6 grid gap-x-10 gap-y-6 border-t border-border pt-6 md:grid-cols-2">
                <SubmissionField label="System status" value={submission.system_status} />
                <SubmissionField
                  label="Decision stage"
                  value={submission.decision_stage}
                />
                <SubmissionField label="Problems" value={submission.problems} />
                <SubmissionField label="Improve first" value={submission.improve_first} />
                <SubmissionField
                  label="Preferred next step"
                  value={submission.preferred_next_step}
                />
                <SubmissionField label="Extra context" value={submission.extra_context} />
              </dl>
            </article>
          );
        })}
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label="Submitted context pagination"
          className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:px-6"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ArrowLeft aria-hidden="true" />
            Previous
          </Button>
          <p className="text-xs font-medium text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, submissions.length)} of {submissions.length}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next
            <ArrowRight aria-hidden="true" />
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
