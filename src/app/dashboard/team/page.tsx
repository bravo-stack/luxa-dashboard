import { redirect } from 'next/navigation';
import {
  Activity,
  KeyRound,
  MailPlus,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricRail } from '@/components/dashboard/metric-rail';
import { InviteSalesExecutiveForm } from '@/components/team/invite-sales-executive-form';
import { MemberSecurityControls } from '@/components/team/member-security-controls';
import { TeamPerformanceChart } from '@/components/team/team-performance-chart';
import { Badge } from '@/components/ui/badge';
import { getTeamAccessOverview } from '@/lib/auth/team';
import type { WorkspaceStatus } from '@/lib/auth/types';
import { getWorkspaceUser } from '@/lib/auth/workspace';
import type { MetricSummary } from '@/lib/dashboard/types';

export const dynamic = 'force-dynamic';

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : 'Never';
}

function statusBadge(status: WorkspaceStatus) {
  if (status === 'active') return <Badge variant="teal">Active</Badge>;
  if (status === 'frozen') return <Badge variant="destructive">Frozen</Badge>;
  return <Badge variant="warm">Invite pending</Badge>;
}

export default async function TeamPage() {
  const user = await getWorkspaceUser();

  if (!user || user.role !== 'admin') redirect('/dashboard');

  const overview = await getTeamAccessOverview();
  const salesMembers = overview.members.filter((member) => member.role === 'sales_exec');
  const metrics: MetricSummary[] = [
    {
      key: 'active_members',
      label: 'Active members',
      value: overview.metrics.activeMembers,
      trend: 'Live',
      trendDirection: 'flat',
      note: `${overview.members.length} provisioned`,
    },
    {
      key: 'pending_invites',
      label: 'Pending invites',
      value: overview.metrics.pendingInvites,
      trend: overview.metrics.pendingInvites ? 'Review' : 'Clear',
      trendDirection: overview.metrics.pendingInvites ? 'down' : 'flat',
      note: 'Awaiting activation',
    },
    {
      key: 'active_sessions',
      label: 'Active sessions',
      value: overview.metrics.activeSessions,
      trend: 'Observed',
      trendDirection: 'flat',
      note: 'Across the workspace',
    },
    {
      key: 'mfa_coverage',
      label: 'MFA coverage',
      value: `${overview.metrics.mfaCoverage}%`,
      trend: 'Future policy',
      trendDirection: overview.metrics.mfaCoverage === 100 ? 'up' : 'flat',
      note: 'TOTP readiness',
    },
  ];

  return (
    <>
      <DashboardHeader
        eyebrow="Administration / people"
        title="Team access control"
        description="Invite sales executives, read operating health, and respond quickly when an account or device may be compromised."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant="teal">Server-authorized</Badge>
            <Badge variant="outline">Public sign-up disabled</Badge>
          </div>
        }
      />

      <MetricRail
        metrics={metrics}
        icons={[UserRoundCheck, MailPlus, Activity, KeyRound]}
      />

      {!overview.dataReady ? (
        <section className="rounded-lg border border-warning/30 bg-warning/8 px-5 py-4 text-sm leading-6 text-foreground">
          Apply the workspace access migration before inviting members. Existing admin
          access remains available, but session history and incident controls are
          intentionally fail-closed.
        </section>
      ) : null}

      <section className="grid overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)] xl:grid-cols-[minmax(0,0.72fr)_minmax(28rem,1.28fr)]">
        <div className="border-b border-border bg-surface-premium px-5 py-6 xl:border-r xl:border-b-0 xl:px-7 xl:py-8">
          <MailPlus className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-7 text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
            Controlled onboarding
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
            Invite a sales executive
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Luxa provisions the sales role server-side and sends a polished, single-use
            activation email. The teammate chooses their own password.
          </p>
          <ol className="mt-8 space-y-4 text-xs leading-5 text-muted-foreground">
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-card font-semibold text-foreground">
                1
              </span>
              Identity and role are created by an administrator.
            </li>
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-card font-semibold text-foreground">
                2
              </span>
              A time-limited email verifies control of the address.
            </li>
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-card font-semibold text-foreground">
                3
              </span>
              The sales desk opens only after password activation.
            </li>
          </ol>
        </div>
        <div className="px-5 py-6 xl:px-7 xl:py-8">
          <InviteSalesExecutiveForm disabled={!overview.dataReady} />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
        <div className="grid gap-4 border-b border-border px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
              Team readout
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Pipeline ownership by executive
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Operating volume by stage—not a vanity leaderboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-chart-3" /> Open
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-chart-2" /> Qualified
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-chart-1" /> Won
            </span>
          </div>
        </div>
        <div className="px-3 py-4 sm:px-5">
          <TeamPerformanceChart members={salesMembers} />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-center gap-2">
            <UsersRound className="size-4 text-primary" aria-hidden="true" />
            <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
              Roster
            </p>
          </div>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
            People and security posture
          </h2>
        </div>
        <div className="divide-y divide-border">
          {overview.members.map((member) => (
            <article
              key={member.id}
              className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(15rem,1.2fr)_repeat(3,minmax(7rem,0.55fr))_minmax(10rem,0.8fr)] lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {member.displayName}
                  </h3>
                  {statusBadge(member.status)}
                  {member.role === 'admin' ? (
                    <Badge variant="outline">Admin</Badge>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {member.email}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {member.jobTitle || 'No title set'}
                </p>
              </div>
              <div>
                <p className="text-[0.625rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  Pipeline
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                  {member.performance.open} open · {member.performance.won} won
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {member.performance.overdue} overdue
                </p>
              </div>
              <div>
                <p className="text-[0.625rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  Follow-up health
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                  {member.performance.followUpHealth}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {member.performance.notesLast7Days} notes / 7d
                </p>
              </div>
              <div>
                <p className="text-[0.625rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  Security
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {member.activeSessions} active session
                  {member.activeSessions === 1 ? '' : 's'}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  {member.mfaEnabled ? 'MFA enrolled' : 'MFA not enrolled'}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Last sign-in
                  <span className="mt-1 block truncate font-medium text-foreground">
                    {formatDate(member.lastSignInAt)}
                  </span>
                </p>
                {member.role === 'sales_exec' ? (
                  <div className="mt-3">
                    <MemberSecurityControls userId={member.id} status={member.status} />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Protected admin account
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
