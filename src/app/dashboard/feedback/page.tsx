import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Inbox,
  MessageSquareText,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricRail } from '@/components/dashboard/metric-rail';
import { FeedbackForm } from '@/components/feedback/feedback-form';
import { FeedbackList } from '@/components/feedback/feedback-list';
import { Button } from '@/components/ui/button';
import { hasWorkspacePermission } from '@/lib/auth/policy';
import { getWorkspaceUser } from '@/lib/auth/workspace';
import type { MetricSummary } from '@/lib/dashboard/types';
import { getFeedbackOverview } from '@/lib/feedback/repository';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getWorkspaceUser();
  if (!user) return null;
  const readPermission =
    user.role === 'admin' ? 'feedback.read_all' : 'feedback.read_own';

  if (!hasWorkspacePermission(user.role, readPermission)) notFound();

  const params = await searchParams;
  const requestedPage = Number.parseInt(params.page ?? '1', 10);
  let overview = await getFeedbackOverview(
    user,
    Number.isFinite(requestedPage) ? requestedPage : 1,
  );

  if (overview.page > overview.totalPages) {
    overview = await getFeedbackOverview(user, overview.totalPages);
  }

  if (user.role === 'admin') {
    const metrics: MetricSummary[] = [
      {
        key: 'all',
        label: 'Submissions',
        value: overview.metrics.total,
        trend: 'All time',
        trendDirection: 'flat',
        note: 'Visible feedback',
      },
      {
        key: 'new',
        label: 'New',
        value: overview.metrics.new,
        trend: 'Triage',
        trendDirection: overview.metrics.new ? 'down' : 'flat',
        note: 'Awaiting review',
      },
      {
        key: 'blocking',
        label: 'Blocking',
        value: overview.metrics.blocking,
        trend: 'Priority',
        trendDirection: overview.metrics.blocking ? 'down' : 'flat',
        note: 'Open impact',
      },
      {
        key: 'resolved',
        label: 'Resolved',
        value: overview.metrics.resolved,
        trend: 'Complete',
        trendDirection: 'up',
        note: 'Closed loop',
      },
    ];

    return (
      <>
        <DashboardHeader
          eyebrow="Product operations"
          title="Workspace feedback"
          description="Review every feature request and bug reported by the sales team, prioritize operational impact, and close the loop with a clear status and note."
        />
        {!overview.dataReady ? <MigrationNotice /> : null}
        <MetricRail
          metrics={metrics}
          icons={[MessageSquareText, Inbox, AlertTriangle, CheckCircle2]}
        />
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">All submissions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review impact, clarify the decision, and give the submitter a useful update.
            </p>
          </div>
          <FeedbackList items={overview.items} canManage={overview.dataReady} />
          <FeedbackPagination
            page={overview.page}
            totalPages={overview.totalPages}
            total={overview.total}
          />
        </section>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        eyebrow="Help improve Luxa"
        title="Submit workspace feedback"
        description="Report a reproducible problem or propose a focused improvement. Your submissions and their review status remain visible below."
      />
      {!overview.dataReady ? <MigrationNotice /> : null}
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(26rem,1.1fr)]">
        <section className="surface-premium rounded-lg p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">New feedback</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Specific examples help the administrator understand urgency and make a good
            product decision.
          </p>
          <div className="mt-6">
            <FeedbackForm disabled={!overview.dataReady} />
          </div>
        </section>
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">My submissions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The latest 30 items and any updates from the administrator.
            </p>
          </div>
          <FeedbackList items={overview.items} canManage={false} />
        </section>
      </div>
    </>
  );
}

function FeedbackPagination({
  page,
  totalPages,
  total,
}: {
  page: number;
  totalPages: number;
  total: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Feedback pages"
    >
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages} · {total.toLocaleString()} submissions
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/feedback?page=${page - 1}`}>
              <ArrowLeft aria-hidden="true" />
              Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft aria-hidden="true" />
            Previous
          </Button>
        )}
        {page < totalPages ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/feedback?page=${page + 1}`}>
              Next
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </nav>
  );
}

function MigrationNotice() {
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/10 px-5 py-4">
      <div className="flex gap-3">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-warning"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Feedback storage is not ready
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Apply the sales operations migration before accepting or triaging feedback.
          </p>
        </div>
      </div>
    </div>
  );
}
