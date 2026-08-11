import { redirect } from 'next/navigation';
import { Activity, KeyRound, MailPlus, UserRoundCheck } from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricRail } from '@/components/dashboard/metric-rail';
import { InviteSalesExecutiveForm } from '@/components/team/invite-sales-executive-form';
import { TeamPerformanceChart } from '@/components/team/team-performance-chart';
import { TeamRoster } from '@/components/team/team-roster';
import { Badge } from '@/components/ui/badge';
import { getTeamAccessOverview } from '@/lib/auth/team';
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

export default async function TeamPage() {
  const user = await getWorkspaceUser();

  if (!user || user.role !== 'admin') redirect('/dashboard');

  const overview = await getTeamAccessOverview();
  const salesMembers = overview.members.filter((member) => member.role === 'sales_exec');
  const rosterMembers = overview.members.map((member) => ({
    ...member,
    lastSignInLabel: formatDate(member.lastSignInAt),
  }));
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

      <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
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

      <TeamRoster members={rosterMembers} />
    </>
  );
}
