import Link from 'next/link';
import {
  Download,
  FileCheck2,
  MailQuestion,
  Plus,
  ShieldCheck,
  TrendingUp,
  UsersRound,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricRail } from '@/components/dashboard/metric-rail';
import { LeadStatusGuide } from '@/components/leads/lead-status-guide';
import { LeadTable } from '@/components/leads/lead-table';
import { Button } from '@/components/ui/button';
import { getWorkspaceUser } from '@/lib/auth/workspace';
import { getLeadDeletionRequestOverview } from '@/lib/dashboard/lead-deletion';
import { getLeadQueue } from '@/lib/dashboard/queries';
import {
  type LeadOrigin,
  leadOrigins,
  type LeadOwnershipScope,
  type LeadStatus,
  leadStatuses,
  type MetricSummary,
} from '@/lib/dashboard/types';

export const dynamic = 'force-dynamic';

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    budget?: string;
    timeline?: string;
    origin?: string;
    date?: string;
    sort?: string;
    page?: string;
    scope?: string;
  }>;
}) {
  const [params, user] = await Promise.all([searchParams, getWorkspaceUser()]);

  if (!user) return null;

  const page = Number.parseInt(params.page ?? '1', 10);
  const requestedStatus = params.status ?? '';
  const requestedOrigin = params.origin ?? '';
  const requestedDate = params.date ?? '';
  let budget = params.budget?.trim().slice(0, 120) || 'all';
  let timeline = params.timeline?.trim().slice(0, 120) || 'all';
  const status = leadStatuses.includes(requestedStatus as LeadStatus)
    ? requestedStatus
    : 'all';
  const origin = leadOrigins.includes(requestedOrigin as LeadOrigin)
    ? requestedOrigin
    : 'all';
  const date = ['today', '7d', 'older'].includes(requestedDate) ? requestedDate : 'all';
  const sort = params.sort === 'oldest' ? 'oldest' : 'newest';
  const ownershipScope: LeadOwnershipScope =
    user.role === 'sales_exec' && (params.scope === 'mine' || params.scope === 'shared')
      ? params.scope
      : 'all';
  const queueOptions = {
    search: params.q,
    status,
    budget,
    timeline,
    origin,
    date,
    sort,
    page: Number.isFinite(page) ? page : 1,
    viewerUserId: user.role === 'sales_exec' ? user.id : undefined,
    ownershipScope,
  } as const;
  let queue = await getLeadQueue(queueOptions);
  const hasInvalidBudget = budget !== 'all' && !queue.budgets.includes(budget);
  const hasInvalidTimeline = timeline !== 'all' && !queue.timelines.includes(timeline);

  if (hasInvalidBudget || hasInvalidTimeline) {
    budget = hasInvalidBudget ? 'all' : budget;
    timeline = hasInvalidTimeline ? 'all' : timeline;
    queue = await getLeadQueue({ ...queueOptions, budget, timeline, page: 1 });
  } else if (queue.page > queue.totalPages) {
    queue = await getLeadQueue({ ...queueOptions, page: queue.totalPages });
  }
  const deletionOverview =
    user.role === 'admin'
      ? await getLeadDeletionRequestOverview('pending')
      : { pendingCount: 0 };
  const activeLeadCount = Object.entries(queue.statusCounts).reduce(
    (total, [status, count]) => total + (status === 'spam' ? 0 : count),
    0,
  );
  const adminMetrics: MetricSummary[] = [
    {
      key: 'active',
      label: 'Active leads',
      value: activeLeadCount,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'Excludes spam',
    },
    {
      key: 'qualified',
      label: 'Qualified',
      value: queue.statusCounts.qualified + queue.statusCounts.won,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'Qualified or won',
    },
    {
      key: 'awaiting',
      label: 'Awaiting reply',
      value: queue.statusCounts.new + queue.statusCounts.qualified,
      trend: 'Review',
      trendDirection: 'down',
      note: 'Needs contact',
    },
    {
      key: 'audits',
      label: 'Platform audits',
      value: queue.platformAuditCount,
      trend: 'High intent',
      trendDirection: 'up',
      note: 'Deep context',
    },
  ];
  const salesMetrics: MetricSummary[] = [
    {
      key: 'shared',
      label: 'Shared funnel',
      value: queue.sharedCount,
      trend: 'Claimable',
      trendDirection: queue.sharedCount ? 'up' : 'flat',
      note: 'Unowned inbound leads',
    },
    {
      key: 'owned',
      label: 'My leads',
      value: queue.ownedCount,
      trend: 'Owned',
      trendDirection: 'flat',
      note: 'Assigned to you',
    },
    ...adminMetrics.slice(0, 2),
  ];
  const leadMetrics = user.role === 'admin' ? adminMetrics : salesMetrics;

  return (
    <>
      <DashboardHeader
        eyebrow="Lead operations"
        title={user.role === 'admin' ? 'Lead command center' : 'Sales lead workspace'}
        description={
          user.role === 'admin'
            ? 'A fast operating queue for qualification, outreach, status movement, and the context behind every opportunity.'
            : 'Work your owned opportunities or claim new inbound leads from the shared funnel pool.'
        }
        actions={
          <>
            {user.role === 'admin' ? (
              <>
                <Button asChild variant="outline">
                  <Link href="/dashboard/leads/deletion-requests">
                    <ShieldCheck className="size-4" />
                    Deletion review
                    {deletionOverview.pendingCount ? (
                      <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[0.625rem] font-bold text-destructive-foreground">
                        {deletionOverview.pendingCount}
                      </span>
                    ) : null}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/api/dashboard/leads/export">
                    <Download className="size-4" />
                    Export leads
                  </Link>
                </Button>
              </>
            ) : null}
            <Button asChild>
              <Link href="/dashboard/leads/new">
                <Plus className="size-4" />
                New lead
              </Link>
            </Button>
          </>
        }
      />
      <MetricRail
        metrics={leadMetrics}
        icons={
          user.role === 'admin'
            ? [UsersRound, TrendingUp, MailQuestion, FileCheck2]
            : [UsersRound, ShieldCheck, TrendingUp, MailQuestion]
        }
      />
      <LeadStatusGuide />
      <LeadTable
        leads={queue.leads}
        total={queue.total}
        page={queue.page}
        totalPages={queue.totalPages}
        statusCounts={queue.statusCounts}
        budgets={queue.budgets}
        timelines={queue.timelines}
        initialSearch={params.q?.slice(0, 200) ?? ''}
        initialFilters={{
          status,
          budget,
          timeline,
          origin,
          date,
        }}
        initialSort={sort}
        viewerRole={user.role}
        currentUserId={user.id}
        ownershipScope={ownershipScope}
      />
    </>
  );
}
