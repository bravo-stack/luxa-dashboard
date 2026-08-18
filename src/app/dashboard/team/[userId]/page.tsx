import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Mail,
  MessageSquareText,
  UserRoundPlus,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricRail } from '@/components/dashboard/metric-rail';
import { LeadStatusBadge } from '@/components/leads/lead-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getSalesExecutiveLeadNoteActivity,
  getTeamAccessOverview,
} from '@/lib/auth/team';
import { getWorkspaceUser } from '@/lib/auth/workspace';
import { getLeads } from '@/lib/dashboard/queries';
import type { MetricSummary } from '@/lib/dashboard/types';
import {
  connectionStatusLabels,
  formatDate,
  formatDateTime,
  formatRelativeTime,
} from '@/lib/dashboard/utils';

export const dynamic = 'force-dynamic';

function memberStatusBadge(status: 'invited' | 'active' | 'frozen') {
  if (status === 'active') return <Badge variant="teal">Active</Badge>;
  if (status === 'frozen') return <Badge variant="destructive">Frozen</Badge>;
  return <Badge variant="warm">Invite pending</Badge>;
}

export default async function SalesExecutiveDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const [{ userId }, user] = await Promise.all([params, getWorkspaceUser()]);

  if (!user || user.role !== 'admin') redirect('/dashboard');

  const [overview, leads, noteActivity] = await Promise.all([
    getTeamAccessOverview(),
    getLeads(),
    getSalesExecutiveLeadNoteActivity(userId),
  ]);
  const member = overview.members.find(
    (item) => item.id === userId && item.role === 'sales_exec',
  );

  if (!member) notFound();

  const createdLeads = leads.filter((lead) => lead.created_by === userId);
  const ownedLeads = leads.filter((lead) => lead.owner_user_id === userId);
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const activityItems = [
    ...createdLeads.map((lead) => ({
      id: `created-${lead.id}`,
      type: 'created' as const,
      createdAt: lead.created_at,
      lead,
    })),
    ...noteActivity.map((activity) => ({
      id: `note-${activity.id}`,
      type: 'note' as const,
      createdAt: activity.createdAt,
      lead: leadById.get(activity.leadId),
    })),
  ]
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .slice(0, 30);
  const wonLeads = ownedLeads.filter((lead) => lead.status === 'won').length;
  const scheduledFollowUps = ownedLeads.filter(
    (lead) => lead.nextFollowUpDate && !['won', 'lost', 'spam'].includes(lead.status),
  ).length;
  const metrics: MetricSummary[] = [
    {
      key: 'created',
      label: 'Leads created',
      value: createdLeads.length,
      trend: 'Authored',
      trendDirection: createdLeads.length ? 'up' : 'flat',
      note: 'Added by this executive',
    },
    {
      key: 'owned',
      label: 'Current portfolio',
      value: ownedLeads.length,
      trend: 'Assigned',
      trendDirection: 'flat',
      note: `${member.performance.open} still open`,
    },
    {
      key: 'won',
      label: 'Won',
      value: wonLeads,
      trend: `${member.performance.conversionRate}%`,
      trendDirection: wonLeads ? 'up' : 'flat',
      note: 'Portfolio conversion',
    },
    {
      key: 'scheduled',
      label: 'Follow-ups set',
      value: scheduledFollowUps,
      trend: `${member.performance.followUpHealth}% health`,
      trendDirection: member.performance.overdue ? 'down' : 'flat',
      note: `${member.performance.overdue} overdue`,
    },
  ];

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/dashboard/team">
          <ArrowLeft aria-hidden="true" />
          Back to team
        </Link>
      </Button>
      <DashboardHeader
        eyebrow="Administration / sales activity"
        title={member.displayName}
        description="A read-only account of the leads this executive created, the portfolio they own, and their attributable CRM activity."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {memberStatusBadge(member.status)}
            <Badge variant="outline">{member.jobTitle || 'Sales executive'}</Badge>
            <Badge variant="secondary">Read-only oversight</Badge>
          </div>
        }
        actions={
          <Button asChild variant="outline">
            <a href={`mailto:${member.email}`}>
              <Mail aria-hidden="true" />
              Email executive
            </a>
          </Button>
        }
      />

      <MetricRail
        metrics={metrics}
        icons={[UserRoundPlus, BriefcaseBusiness, CheckCircle2, CalendarClock]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
          <div className="border-b border-border px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2 text-primary">
              <BriefcaseBusiness className="size-4" aria-hidden="true" />
              <p className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase">
                Created portfolio
              </p>
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Leads added by {member.displayName}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Current stage and interaction fields are shown exactly as they exist in the
              CRM.
            </p>
          </div>

          {createdLeads.length ? (
            <div className="divide-y divide-border">
              {createdLeads.map((lead) => (
                <article
                  key={lead.id}
                  className="grid gap-4 px-5 py-5 transition-colors hover:bg-primary/3 sm:px-6 lg:grid-cols-[minmax(13rem,1fr)_minmax(10rem,0.7fr)_minmax(12rem,0.85fr)_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {lead.name}
                    </Link>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {lead.company} · {lead.email}
                    </p>
                  </div>
                  <div>
                    <LeadStatusBadge status={lead.status} />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Updated {formatRelativeTime(lead.updated_at)}
                    </p>
                  </div>
                  <div className="min-w-0 text-xs">
                    <p className="font-semibold text-foreground">
                      {lead.connectionStatus
                        ? connectionStatusLabels[lead.connectionStatus]
                        : 'No outreach captured'}
                    </p>
                    <p className="mt-1 truncate text-muted-foreground">
                      {lead.nextFollowUpAction || 'No next action set'}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {lead.nextFollowUpDate
                        ? `Due ${formatDate(lead.nextFollowUpDate)}`
                        : 'No follow-up date'}
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/leads/${lead.id}`}>
                      Inspect
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <BriefcaseBusiness
                className="mx-auto size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold text-foreground">
                No leads created yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Their first manually added lead will appear here.
              </p>
            </div>
          )}
        </section>

        <aside className="h-fit overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
          <div className="border-b border-border bg-surface-premium px-5 py-5">
            <div className="flex items-center gap-2 text-primary">
              <Activity className="size-4" aria-hidden="true" />
              <p className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase">
                Activity
              </p>
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Recent CRM actions
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Lead creation and notes are actor-attributed. Current interaction state is
              shown in the portfolio.
            </p>
          </div>
          {activityItems.length ? (
            <ol className="divide-y divide-border">
              {activityItems.map((item) => {
                const Icon = item.type === 'note' ? MessageSquareText : UserRoundPlus;

                return (
                  <li key={item.id} className="flex gap-3 px-5 py-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/9 text-primary">
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {item.type === 'note' ? 'Added an internal note' : 'Created lead'}
                      </p>
                      {item.lead ? (
                        <Link
                          href={`/dashboard/leads/${item.lead.id}`}
                          className="mt-1 block truncate text-xs font-medium text-primary hover:underline"
                        >
                          {item.lead.name} · {item.lead.company}
                        </Link>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Lead no longer available
                        </p>
                      )}
                      <time
                        dateTime={item.createdAt}
                        className="mt-1 block text-xs text-muted-foreground"
                      >
                        {formatDateTime(item.createdAt)}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="px-5 py-10 text-center">
              <Activity
                className="mx-auto size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold text-foreground">
                No attributable activity yet
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Lead creation and note activity will appear here.
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
