import Link from 'next/link';
import {
  Download,
  Eye,
  MailQuestion,
  Plus,
  ShieldCheck,
  TrendingUp,
  UserRoundSearch,
  UsersRound,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricRail } from '@/components/dashboard/metric-rail';
import { AdminLeadSections } from '@/components/leads/admin-lead-sections';
import { LeadStatusGuide } from '@/components/leads/lead-status-guide';
import { LeadTable } from '@/components/leads/lead-table';
import { Button } from '@/components/ui/button';
import { getSalesLeadCreators } from '@/lib/auth/team';
import { getWorkspaceUser } from '@/lib/auth/workspace';
import { partitionAdminLeadWorkspace } from '@/lib/dashboard/admin-lead-oversight';
import { getLeadDeletionRequestOverview } from '@/lib/dashboard/lead-deletion';
import { getLeadQueue, getLeads } from '@/lib/dashboard/queries';
import {
  type LeadOrigin,
  leadOrigins,
  type LeadOwnershipScope,
  type LeadStatus,
  leadStatuses,
  type MetricSummary,
} from '@/lib/dashboard/types';

export const dynamic = 'force-dynamic';

type LeadSearchParams = {
  q?: string;
  status?: string;
  budget?: string;
  timeline?: string;
  origin?: string;
  date?: string;
  sort?: string;
  page?: string;
  scope?: string;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<LeadSearchParams>;
}) {
  const user = await getWorkspaceUser();

  if (!user) return null;

  if (user.role === 'admin') {
    const [leads, salesMembers, deletionOverview] = await Promise.all([
      getLeads(),
      getSalesLeadCreators(),
      getLeadDeletionRequestOverview('pending'),
    ]);
    const { adminLeads, salesLeadGroups } = partitionAdminLeadWorkspace(
      leads,
      salesMembers,
    );
    const salesLeadCount = salesLeadGroups.reduce(
      (total, group) => total + group.leads.length,
      0,
    );
    const activeLeadCount = leads.filter(
      (lead) => !['won', 'lost', 'spam'].includes(lead.status),
    ).length;
    const scheduledFollowUps = leads.filter(
      (lead) => lead.nextFollowUpDate && !['won', 'lost', 'spam'].includes(lead.status),
    ).length;
    const metrics: MetricSummary[] = [
      {
        key: 'admin_managed',
        label: 'Admin-managed',
        value: adminLeads.length,
        trend: 'Editable',
        trendDirection: 'flat',
        note: 'Direct and inbound leads',
      },
      {
        key: 'sales_created',
        label: 'Sales-created',
        value: salesLeadCount,
        trend: 'Read only',
        trendDirection: salesLeadCount ? 'up' : 'flat',
        note: 'Executive-authored leads',
      },
      {
        key: 'active',
        label: 'Active pipeline',
        value: activeLeadCount,
        trend: 'Live',
        trendDirection: 'flat',
        note: 'Excludes closed and spam',
      },
      {
        key: 'follow_up',
        label: 'Follow-ups set',
        value: scheduledFollowUps,
        trend: scheduledFollowUps ? 'Scheduled' : 'Clear',
        trendDirection: scheduledFollowUps ? 'up' : 'flat',
        note: 'Across active leads',
      },
    ];

    return (
      <>
        <DashboardHeader
          eyebrow="Lead operations / administration"
          title="Lead oversight"
          description="Run the admin lead desk and inspect sales-created opportunities from a clear, read-only oversight lane."
          actions={
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
              <Button asChild>
                <Link href="/dashboard/leads/new">
                  <Plus className="size-4" />
                  Add admin lead
                </Link>
              </Button>
            </>
          }
        />
        <MetricRail
          metrics={metrics}
          icons={[ShieldCheck, Eye, TrendingUp, UserRoundSearch]}
        />
        <AdminLeadSections adminLeads={adminLeads} salesLeadGroups={salesLeadGroups} />
      </>
    );
  }

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
  const ownershipScope: LeadOwnershipScope =
    params.scope === 'mine' || params.scope === 'shared' ? params.scope : 'all';
  const queueOptions = {
    search: params.q,
    status,
    budget,
    timeline,
    origin,
    date,
    sort,
    page: Number.isFinite(page) ? page : 1,
    viewerUserId: user.id,
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

  const activeLeadCount = Object.entries(queue.statusCounts).reduce(
    (total, [leadStatus, count]) => total + (leadStatus === 'spam' ? 0 : count),
    0,
  );
  const metrics: MetricSummary[] = [
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
  ];

  return (
    <>
      <DashboardHeader
        eyebrow="Lead operations"
        title="Sales lead workspace"
        description="Work your owned opportunities or claim new inbound leads from the shared funnel pool."
        actions={
          <Button asChild>
            <Link href="/dashboard/leads/new">
              <Plus className="size-4" />
              New lead
            </Link>
          </Button>
        }
      />
      <MetricRail
        metrics={metrics}
        icons={[UsersRound, ShieldCheck, TrendingUp, MailQuestion]}
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
        initialFilters={{ status, budget, timeline, origin, date }}
        initialSort={sort}
        viewerRole={user.role}
        currentUserId={user.id}
        ownershipScope={ownershipScope}
      />
    </>
  );
}
