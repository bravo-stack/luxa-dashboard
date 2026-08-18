'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import { MemberSecurityControls } from '@/components/team/member-security-controls';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TeamMemberOverview } from '@/lib/auth/team';
import {
  filterTeamRosterMembers,
  getTeamRosterCounts,
  isTeamInviteDateFilter,
  isTeamRosterFilter,
  paginateTeamRosterMembers,
  type TeamInviteDateFilter,
  teamInviteDateFilterOptions,
  type TeamRosterFilter,
  teamRosterFilterOptions,
} from '@/lib/auth/team-roster-filter';
import type { WorkspaceStatus } from '@/lib/auth/types';

export type TeamRosterMember = TeamMemberOverview & {
  invitedAtLabel: string;
  lastSignInLabel: string;
};

const rosterPageSize = 8;

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
          {member.role === 'sales_exec' ? (
            <Link
              href={`/dashboard/team/${member.id}`}
              className="group inline-flex min-w-0 items-center gap-1.5 rounded-sm text-sm font-semibold text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="truncate">{member.displayName}</span>
              <ArrowUpRight
                className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          ) : (
            <h3 className="truncate text-sm font-semibold text-foreground">
              {member.displayName}
            </h3>
          )}
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
          Invite sent
          {member.invitedAt ? (
            <time
              dateTime={member.invitedAt}
              className="mt-1 block truncate font-medium text-foreground"
            >
              {member.invitedAtLabel}
            </time>
          ) : (
            <span className="mt-1 block font-medium text-foreground">Not recorded</span>
          )}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Last sign-in
          <span className="mt-1 block truncate font-medium text-foreground">
            {member.lastSignInLabel}
          </span>
        </p>
        {member.role === 'sales_exec' ? (
          <div className="mt-3">
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
              <Link href={`/dashboard/team/${member.id}`}>
                View lead activity
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
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

export function TeamRoster({
  members,
  referenceTime,
}: {
  members: TeamRosterMember[];
  referenceTime: string;
}) {
  const [filter, setFilter] = useState<TeamRosterFilter>('all');
  const [inviteDateFilter, setInviteDateFilter] = useState<TeamInviteDateFilter>('any');
  const [page, setPage] = useState(1);
  const counts = getTeamRosterCounts(members);
  const filteredMembers = filterTeamRosterMembers(
    members,
    filter,
    inviteDateFilter,
    new Date(referenceTime).getTime(),
  );
  const pagination = paginateTeamRosterMembers(filteredMembers, page, rosterPageSize);
  const emptyState = emptyStateCopy[filter];
  const firstVisible = pagination.items.length ? pagination.startIndex + 1 : 0;
  const lastVisible = pagination.startIndex + pagination.items.length;

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
      <Tabs
        value={filter}
        onValueChange={(value) => {
          if (isTeamRosterFilter(value)) {
            setFilter(value);
            setPage(1);
          }
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

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="-mx-1 min-w-0 [scrollbar-width:none] overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden">
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
            <div className="w-full sm:w-56">
              <label
                id="invite-date-filter-label"
                className="mb-1.5 flex items-center gap-1.5 text-[0.6875rem] font-semibold text-muted-foreground"
              >
                <CalendarClock className="size-3.5" aria-hidden="true" />
                Invite sent
              </label>
              <Select
                value={inviteDateFilter}
                onValueChange={(value) => {
                  if (isTeamInviteDateFilter(value)) {
                    setInviteDateFilter(value);
                    setPage(1);
                  }
                }}
              >
                <SelectTrigger
                  className="h-9 text-xs"
                  aria-labelledby="invite-date-filter-label"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teamInviteDateFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value={filter} className="mt-0">
          <p className="sr-only" aria-live="polite">
            Showing {pagination.items.length} of {filteredMembers.length} matching people
          </p>
          {filteredMembers.length ? (
            <div className="divide-y divide-border">
              {pagination.items.map((member) => (
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
                {inviteDateFilter === 'any'
                  ? emptyState.description
                  : 'No people match this status and invitation date range.'}
              </p>
              {inviteDateFilter !== 'any' ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setInviteDateFilter('any');
                    setPage(1);
                  }}
                >
                  Clear invite date
                </Button>
              ) : null}
            </div>
          )}
          {filteredMembers.length ? (
            <nav
              className="flex flex-col gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              aria-label="People pages"
            >
              <p className="text-xs text-muted-foreground tabular-nums">
                Showing {firstVisible}–{lastVisible} of {filteredMembers.length} matching
                people
              </p>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-end">
                <span className="text-xs text-muted-foreground tabular-nums">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === 1}
                    onClick={() => setPage(pagination.currentPage - 1)}
                  >
                    <ArrowLeft aria-hidden="true" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => setPage(pagination.currentPage + 1)}
                  >
                    Next
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </nav>
          ) : null}
        </TabsContent>
      </Tabs>
    </section>
  );
}
