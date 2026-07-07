import { FileText } from 'lucide-react';

import { EmptyState } from '@/components/dashboard/empty-state';
import type { AuditSubmission } from '@/lib/dashboard/types';
import { formatDateTime } from '@/lib/dashboard/utils';

type LeadAuditDetailsProps = {
  submissions: AuditSubmission[];
};

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-white/2.5 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  );
}

export function LeadAuditDetails({ submissions }: LeadAuditDetailsProps) {
  const latestSubmission = submissions[0];

  if (!latestSubmission) {
    return (
      <EmptyState
        icon={FileText}
        title="No audit submission yet"
        description="When the lead completes a quick-start or full audit, the operational context will appear here."
      />
    );
  }

  return (
    <section className="surface-elevated rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-accent-violet uppercase">
            Audit submission
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            {latestSubmission.project_type}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {latestSubmission.submission_type === 'full_audit'
              ? 'Full audit'
              : 'Quick-start'}{' '}
            submitted {formatDateTime(latestSubmission.created_at)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm text-muted-foreground">
          {latestSubmission.industry_segment}
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DetailBlock title="System status">{latestSubmission.system_status}</DetailBlock>
        <DetailBlock title="Decision stage">
          {latestSubmission.decision_stage}
        </DetailBlock>
        <DetailBlock title="Problems">{latestSubmission.problems}</DetailBlock>
        <DetailBlock title="Improve first">{latestSubmission.improve_first}</DetailBlock>
        <DetailBlock title="Preferred next step">
          {latestSubmission.preferred_next_step}
        </DetailBlock>
        <DetailBlock title="Extra context">{latestSubmission.extra_context}</DetailBlock>
      </div>
      {submissions.length > 1 ? (
        <div className="mt-5 rounded-2xl border border-border bg-white/2.5 p-4">
          <h3 className="text-sm font-semibold text-foreground">Previous submissions</h3>
          <div className="mt-3 space-y-2">
            {submissions.slice(1).map((submission) => (
              <div
                key={submission.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"
              >
                <span>{submission.project_type}</span>
                <span>{formatDateTime(submission.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
