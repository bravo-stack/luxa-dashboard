import type { WorkspaceStatus } from '@/lib/auth/types';

export type TeamRosterFilter = 'all' | WorkspaceStatus;
export type TeamInviteDateFilter =
  'any' | 'last_24_hours' | 'last_7_days' | 'last_30_days' | 'older_than_30_days';

export const teamInviteDateFilterOptions: ReadonlyArray<{
  value: TeamInviteDateFilter;
  label: string;
}> = [
  { value: 'any', label: 'Any invite date' },
  { value: 'last_24_hours', label: 'Past 24 hours' },
  { value: 'last_7_days', label: 'Past 7 days' },
  { value: 'last_30_days', label: 'Past 30 days' },
  { value: 'older_than_30_days', label: 'More than 30 days ago' },
];

export const teamRosterFilterOptions: ReadonlyArray<{
  value: TeamRosterFilter;
  label: string;
}> = [
  { value: 'all', label: 'All' },
  { value: 'invited', label: 'Invite pending' },
  { value: 'active', label: 'Active' },
  { value: 'frozen', label: 'Frozen' },
];

export function isTeamRosterFilter(value: string): value is TeamRosterFilter {
  return teamRosterFilterOptions.some((option) => option.value === value);
}

export function isTeamInviteDateFilter(value: string): value is TeamInviteDateFilter {
  return teamInviteDateFilterOptions.some((option) => option.value === value);
}

function matchesInviteDate(
  invitedAt: string | null,
  filter: TeamInviteDateFilter,
  referenceTime: number,
) {
  if (filter === 'any') return true;
  if (!invitedAt) return false;

  const invitedTime = new Date(invitedAt).getTime();
  if (!Number.isFinite(invitedTime)) return false;

  const age = referenceTime - invitedTime;
  if (age < 0) return false;

  const day = 24 * 60 * 60 * 1_000;
  if (filter === 'last_24_hours') return age <= day;
  if (filter === 'last_7_days') return age <= 7 * day;
  if (filter === 'last_30_days') return age <= 30 * day;
  return age > 30 * day;
}

export function filterTeamRosterMembers<
  T extends { status: WorkspaceStatus; invitedAt?: string | null },
>(
  members: T[],
  filter: TeamRosterFilter,
  inviteDateFilter: TeamInviteDateFilter = 'any',
  referenceTime = Date.now(),
) {
  return members.filter(
    (member) =>
      (filter === 'all' || member.status === filter) &&
      matchesInviteDate(member.invitedAt ?? null, inviteDateFilter, referenceTime),
  );
}

export function paginateTeamRosterMembers<T>(
  members: T[],
  page: number,
  pageSize: number,
) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(members.length / safePageSize));
  const currentPage = Math.min(totalPages, Math.max(1, Math.floor(page)));
  const startIndex = (currentPage - 1) * safePageSize;

  return {
    currentPage,
    totalPages,
    startIndex,
    items: members.slice(startIndex, startIndex + safePageSize),
  };
}

export function getTeamRosterCounts<T extends { status: WorkspaceStatus }>(members: T[]) {
  return members.reduce<Record<TeamRosterFilter, number>>(
    (counts, member) => {
      counts.all += 1;
      counts[member.status] += 1;
      return counts;
    },
    { all: 0, active: 0, invited: 0, frozen: 0 },
  );
}
