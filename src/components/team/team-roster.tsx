'use client';

import { useState } from 'react';
import { ShieldCheck, UsersRound } from 'lucide-react';

import { MemberSecurityControls } from '@/components/team/member-security-controls';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TeamMemberOverview } from '@/lib/auth/team';
import {
  filterTeamRosterMembers,
  getTeamRosterCounts,
  isTeamRosterFilter,
  type TeamRosterFilter,
  teamRosterFilterOptions,
} from '@/lib/auth/team-roster-filter';
import type { WorkspaceStatus } from '@/lib/auth/types';

export type TeamRosterMember = TeamMemberOverview & {
  lastSignInLabel: string;
};

const emptyStateCopy: Record<TeamRosterFilter, { title: string; description: string }> = {
  all: {
    title: 'No people provisioned',
    description: 'Invited and active workspace members will appear here.',
  },
  active: {
    title: 'No active members',
    description: 'People appear here after completing account activation.',
  },
  invited: {
    title: 'No pending invitations',
    description: 'New invitations awaiting activation will appear here.',
  },
  frozen: {
    title: 'No frozen accounts',
    description: 'Accounts with temporarily blocked access will appear here.',
  },
};

function statusBadge(status: WorkspaceStatus) {
  if (status === 'active') return <Badge variant="teal">Active</Badge>;
  if (status === 'frozen') return <Badge variant="destructive">Frozen</Badge>;
  return <Badge variant="warm">Invite pending</Badge>;
}

function MemberRow({ member }: { member: TeamRosterMember }) {
  return (
    <article className="grid min-w-0 gap-x-6 gap-y-5 px-5 py-5 sm:grid-cols-2 xl:grid-cols-[minmax(15rem,1.2fr)_repeat(3,minmax(7rem,0.55fr))_minmax(10rem,0.8fr)] xl:items-center">
      <div className="min-w-0 sm:col-span-2 xl:col-span-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {member.displayName}
          </h3>
          {statusBadge(member.status)}
          {member.role === 'admin' ? <Badge variant="outline">Admin</Badge> : null}
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{member.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {member.jobTitle || 'No title set'}
        </p>
      </div>
      <div className="min-w-0">
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
      <div className="min-w-0">
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
      <div className="min-w-0">
        <p className="text-[0.625rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Security
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {member.activeSessions} active session{member.activeSessions === 1 ? '' : 's'}
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
            {member.lastSignInLabel}
          </span>
        </p>
        {member.role === 'sales_exec' ? (
          <div className="mt-3">
            <MemberSecurityControls
              displayName={member.displayName}
              email={member.email}
              userId={member.id}
              status={member.status}
            />
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">Protected admin account</p>
        )}
      </div>
    </article>
  );
}

export function TeamRoster({ members }: { members: TeamRosterMember[] }) {
  const [filter, setFilter] = useState<TeamRosterFilter>('all');
  const counts = getTeamRosterCounts(members);
  const filteredMembers = filterTeamRosterMembers(members, filter);
  const emptyState = emptyStateCopy[filter];

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
      <Tabs
        value={filter}
        onValueChange={(value) => {
          if (isTeamRosterFilter(value)) setFilter(value);
        }}
      >
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

          <div className="-mx-1 mt-4 [scrollbar-width:none] overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden">
            <TabsList
              className="h-auto min-w-max justify-start rounded-lg bg-muted/65 p-1"
              aria-label="Filter people by account status"
            >
              {teamRosterFilterOptions.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className="group min-h-9 gap-2 px-3 text-xs"
                >
                  {option.label}
                  <span className="rounded-sm bg-background/75 px-1.5 py-0.5 text-[0.625rem] font-semibold text-muted-foreground tabular-nums group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary">
                    {counts[option.value]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <TabsContent value={filter} className="mt-0">
          <p className="sr-only" aria-live="polite">
            Showing {filteredMembers.length} of {members.length} people
          </p>
          {filteredMembers.length ? (
            <div className="divide-y divide-border">
              {filteredMembers.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <UsersRound
                className="mx-auto size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold text-foreground">
                {emptyState.title}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                {emptyState.description}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
