import Link from 'next/link';
import { ArrowUpRight, ClipboardCheck } from 'lucide-react';

import { LeadScoreBadge } from '@/components/leads/lead-score-badge';
import { LeadStatusBadge } from '@/components/leads/lead-status-badge';
import { Button } from '@/components/ui/button';
import type { RecentSubmissionItem } from '@/lib/dashboard/types';
import { formatRelativeTime } from '@/lib/dashboard/utils';

type RecentSubmissionsProps = {
  submissions: RecentSubmissionItem[];
};

export function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
  return (
    <section className="surface-elevated rounded-3xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-primary uppercase">
            Recent submissions
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Newest audit signals
          </h2>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/leads">View leads</Link>
        </Button>
      </div>
      <div className="mt-6 space-y-3">
        {submissions.map(({ lead, submission }) => (
          <Link
            key={submission.id}
            href={`/dashboard/leads/${lead.id}`}
            className="card-lift group block rounded-2xl border border-border bg-white/2.5 p-4 hover:bg-white/4"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <ClipboardCheck className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{lead.name}</h3>
                    <span className="text-sm text-muted-foreground">{lead.company}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {submission.project_type}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border bg-white/3 px-2.5 py-1">
                      {submission.submission_type === 'full_audit'
                        ? 'Full audit'
                        : 'Quick-start'}
                    </span>
                    <span className="rounded-full border border-border bg-white/3 px-2.5 py-1">
                      {submission.budget_range}
                    </span>
                    <span className="rounded-full border border-border bg-white/3 px-2.5 py-1">
                      {submission.timeline}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <LeadScoreBadge score={lead.qualification_score} />
                <LeadStatusBadge status={lead.status} />
                <span className="rounded-full border border-border bg-white/3 px-2.5 py-1 text-xs text-muted-foreground">
                  {formatRelativeTime(submission.created_at)}
                </span>
                <ArrowUpRight
                  className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
