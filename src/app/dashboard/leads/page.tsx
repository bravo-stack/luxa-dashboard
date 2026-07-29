import Link from 'next/link';
import {
  Download,
  FileCheck2,
  MailQuestion,
  Plus,
  TrendingUp,
  UsersRound,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricRail } from '@/components/dashboard/metric-rail';
import { LeadTable } from '@/components/leads/lead-table';
import { Button } from '@/components/ui/button';
import { getLeadQueue } from '@/lib/dashboard/queries';
import {
  type LeadOrigin,
  leadOrigins,
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
  }>;
}) {
  const params = await searchParams;
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
  const queueOptions = {
    search: params.q,
    status,
    budget,
    timeline,
    origin,
    date,
    sort,
    page: Number.isFinite(page) ? page : 1,
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
  const activeLeadCount = Object.entries(queue.statusCounts).reduce(
    (total, [status, count]) => total + (status === 'spam' ? 0 : count),
    0,
  );
  const leadMetrics: MetricSummary[] = [
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

  return (
    <>
      <DashboardHeader
        eyebrow="Lead operations"
        title="Lead command center"
        description="A fast operating queue for qualification, outreach, status movement, and the context behind every opportunity."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/api/dashboard/leads/export">
                <Download className="size-4" />
                Export leads
              </Link>
            </Button>
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
        icons={[UsersRound, TrendingUp, MailQuestion, FileCheck2]}
      />
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
      />
    </>
  );
}
