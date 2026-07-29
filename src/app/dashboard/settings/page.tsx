import Link from 'next/link';
import {
  Activity,
  BarChart3,
  Check,
  Database,
  FileDown,
  KeyRound,
  Laptop2,
  MailCheck,
  ShieldCheck,
  TriangleAlert,
  UserRoundCheck,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricRail } from '@/components/dashboard/metric-rail';
import { SecurityEventLog } from '@/components/settings/security-event-log';
import { SessionRegistry } from '@/components/settings/session-registry';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDashboardAnalytics } from '@/lib/analytics/server';
import {
  getAccountSecurityOverview,
  getTeamAccessOverview,
  type TeamAccessOverview,
} from '@/lib/auth/team';
import { getWorkspaceUser } from '@/lib/auth/workspace';
import { getLeadQueue } from '@/lib/dashboard/queries';
import type { MetricSummary } from '@/lib/dashboard/types';

type ReadinessItem = {
  label: string;
  description: string;
  value: string;
  ready: boolean;
  icon: typeof Check;
};

export const dynamic = 'force-dynamic';

function ReadinessList({ items }: { items: ReadinessItem[] }) {
  return (
    <div className="divide-y divide-border">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.label}
            className="grid gap-4 px-5 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
          >
            <div
              className={`flex size-10 items-center justify-center rounded-full border ${
                item.ready
                  ? 'border-success/20 bg-success/10 text-success'
                  : 'border-warning/25 bg-warning/10 text-warning'
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </div>
            <Badge variant={item.ready ? 'teal' : 'warm'} className="w-fit">
              {item.ready ? (
                <Check className="mr-1 size-3.5" />
              ) : (
                <TriangleAlert className="mr-1 size-3.5" />
              )}
              {item.value}
            </Badge>
          </article>
        );
      })}
    </div>
  );
}

async function AccountSecurityPage({
  user,
}: {
  user: NonNullable<Awaited<ReturnType<typeof getWorkspaceUser>>>;
}) {
  const security = await getAccountSecurityOverview(user);
  const metrics: MetricSummary[] = [
    {
      key: 'active_sessions',
      label: 'Active sessions',
      value: security.activeSessions,
      trend: 'Observed',
      trendDirection: 'flat',
      note: 'Your Luxa sessions',
    },
    {
      key: 'assurance',
      label: 'Current assurance',
      value: user.session.assuranceLevel.toUpperCase(),
      trend: user.session.assuranceLevel === 'aal2' ? 'MFA' : 'Password',
      trendDirection: user.session.assuranceLevel === 'aal2' ? 'up' : 'flat',
      note: 'MFA-ready session claim',
    },
    {
      key: 'access_events',
      label: 'Access events',
      value: security.events.length,
      trend: 'Recent',
      trendDirection: 'flat',
      note: 'Your security trail',
    },
    {
      key: 'account_state',
      label: 'Account state',
      value: 'Active',
      trend: 'Protected',
      trendDirection: 'up',
      note: 'Sales workspace',
    },
  ];

  return (
    <>
      <DashboardHeader
        eyebrow="Account / security"
        title="Your access and sessions"
        description="Review recent account activity, understand your current session, and start a secure password recovery when needed."
        actions={
          <Button asChild variant="outline">
            <Link href="/forgot-password">
              <KeyRound className="size-4" />
              Reset password
            </Link>
          </Button>
        }
        meta={<Badge variant="teal">Account active</Badge>}
      />
      <MetricRail
        metrics={metrics}
        icons={[Laptop2, ShieldCheck, Activity, UserRoundCheck]}
      />
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
        <div className="border-b border-border px-5 py-5">
          <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
            Session registry
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Your signed-in devices
          </h2>
        </div>
        <SessionRegistry sessions={security.sessions} showMember={false} />
      </section>
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
        <div className="border-b border-border px-5 py-5">
          <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
            Account history
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Recent security events
          </h2>
        </div>
        <SecurityEventLog events={security.events} />
      </section>
      <section className="grid gap-5 rounded-xl border border-border bg-surface-premium px-5 py-6 sm:grid-cols-[auto_minmax(0,1fr)]">
        <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            MFA foundation is ready
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Luxa already records authenticator assurance levels. Google Authenticator and
            other TOTP apps can be introduced without changing your account or
            permissions.
          </p>
        </div>
      </section>
    </>
  );
}

function getAdminMetrics(overview: TeamAccessOverview): MetricSummary[] {
  return [
    {
      key: 'active_members',
      label: 'Active members',
      value: overview.metrics.activeMembers,
      trend: 'Authorized',
      trendDirection: 'flat',
      note: `${overview.metrics.pendingInvites} invite pending`,
    },
    {
      key: 'active_sessions',
      label: 'Active sessions',
      value: overview.metrics.activeSessions,
      trend: 'Live registry',
      trendDirection: 'flat',
      note: 'All workspace members',
    },
    {
      key: 'mfa_coverage',
      label: 'MFA coverage',
      value: `${overview.metrics.mfaCoverage}%`,
      trend: 'Future policy',
      trendDirection: overview.metrics.mfaCoverage === 100 ? 'up' : 'flat',
      note: 'Verified TOTP factors',
    },
    {
      key: 'unassigned_leads',
      label: 'Unassigned leads',
      value: overview.metrics.unassignedLeads,
      trend: overview.metrics.unassignedLeads ? 'Action' : 'Clear',
      trendDirection: overview.metrics.unassignedLeads ? 'down' : 'flat',
      note: 'Ownership coverage',
    },
  ];
}

export default async function SettingsPage() {
  const user = await getWorkspaceUser();

  if (!user) return null;
  if (user.role !== 'admin') return <AccountSecurityPage user={user} />;

  const [analyticsResult, leadsResult, teamResult] = await Promise.allSettled([
    getDashboardAnalytics({ dateRange: '7d' }),
    getLeadQueue({ pageSize: 10 }),
    getTeamAccessOverview(),
  ]);
  const analytics = analyticsResult.status === 'fulfilled' ? analyticsResult.value : null;
  const leads = leadsResult.status === 'fulfilled' ? leadsResult.value : null;
  const team =
    teamResult.status === 'fulfilled'
      ? teamResult.value
      : ({
          members: [],
          sessions: [],
          events: [],
          metrics: {
            activeMembers: 0,
            pendingInvites: 0,
            frozenMembers: 0,
            activeSessions: 0,
            mfaCoverage: 0,
            unassignedLeads: 0,
          },
          dataReady: false,
        } satisfies TeamAccessOverview);
  const authConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const emailLinksConfigured = Boolean(
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  );
  const readiness: ReadinessItem[] = [
    {
      label: 'Workspace access boundary',
      description:
        'Every dashboard request resolves an active server-managed membership and session.',
      value: authConfigured ? 'Configured' : 'Missing',
      ready: authConfigured,
      icon: ShieldCheck,
    },
    {
      label: 'Access registry',
      description:
        'Membership states, application sessions, and immutable security events are available.',
      value: team.dataReady ? 'Online' : 'Migration required',
      ready: team.dataReady,
      icon: UserRoundCheck,
    },
    {
      label: 'Email callback origin',
      description:
        'Invitation and recovery links use a fixed production origin instead of request input.',
      value: emailLinksConfigured ? 'Pinned' : 'Missing',
      ready: emailLinksConfigured,
      icon: MailCheck,
    },
    {
      label: 'CRM connection',
      description: 'Lead reads and mutations use the protected Supabase server client.',
      value: leads ? `${leads.total.toLocaleString()} leads reachable` : 'Unavailable',
      ready: Boolean(leads),
      icon: Database,
    },
    {
      label: 'Analytics connection',
      description:
        'Umami signals are independently fetched with partial-failure isolation.',
      value: analytics
        ? `${analytics.availability.available.length} signal groups online`
        : 'Unavailable',
      ready: Boolean(analytics),
      icon: BarChart3,
    },
    {
      label: 'Protected export',
      description: 'CSV output is admin-only, non-cacheable, and spreadsheet-safe.',
      value: 'Enabled',
      ready: true,
      icon: FileDown,
    },
  ];
  const readyCount = readiness.filter((item) => item.ready).length;

  return (
    <>
      <DashboardHeader
        eyebrow="Administration / security"
        title="Workspace security and systems"
        description="One composed view of identity posture, live sessions, access events, and the production controls Luxa depends on."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant={readyCount === readiness.length ? 'teal' : 'warm'}>
              {readyCount}/{readiness.length} controls ready
            </Badge>
            {team.metrics.frozenMembers ? (
              <Badge variant="destructive">
                {team.metrics.frozenMembers} frozen account
                {team.metrics.frozenMembers === 1 ? '' : 's'}
              </Badge>
            ) : null}
          </div>
        }
        actions={
          <Button asChild>
            <Link href="/dashboard/team">
              <UserRoundCheck className="size-4" />
              Manage team
            </Link>
          </Button>
        }
      />

      <MetricRail
        metrics={getAdminMetrics(team)}
        icons={[UserRoundCheck, Laptop2, ShieldCheck, TriangleAlert]}
      />

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
              Live sessions
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Everyone currently observed
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Session IDs come from verified Supabase JWT claims; raw tokens are never
              stored.
            </p>
          </div>
          <Badge variant="outline">{team.sessions.length} recent sessions</Badge>
        </div>
        <SessionRegistry sessions={team.sessions.slice(0, 30)} />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
              Login and access log
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Authentication trail
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Successful and denied sign-ins, recovery, invitations, and administrator
              incident actions.
            </p>
          </div>
          <Badge variant="outline">{team.events.length} recent events</Badge>
        </div>
        <SecurityEventLog events={team.events.slice(0, 40)} />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
        <div className="border-b border-border px-5 py-5">
          <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
            System readiness
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Production controls
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Secret values are never rendered; only safe readiness state is shown.
          </p>
        </div>
        <ReadinessList items={readiness} />
      </section>

      <section className="grid gap-5 rounded-xl border border-border bg-surface-premium px-5 py-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            MFA-ready, intentionally not forced yet
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Membership policy and session logs already carry AAL1/AAL2. A future TOTP
            rollout can require Google Authenticator-compatible verification for admin
            actions without redesigning access control.
          </p>
        </div>
        <Badge variant="outline">Foundation ready</Badge>
      </section>

      {analytics?.availability.unavailable.length ? (
        <section className="rounded-xl border border-warning/25 bg-warning/8 px-5 py-5">
          <div className="flex items-start gap-3">
            <TriangleAlert
              className="mt-0.5 size-5 shrink-0 text-warning"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-semibold text-foreground">
                Optional analytics signals unavailable
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The dashboard remains operational. Unavailable groups:{' '}
                {analytics.availability.unavailable.join(', ')}.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
