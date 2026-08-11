import type { WorkspaceStatus } from '@/lib/auth/types';

export type TeamRosterFilter = 'all' | WorkspaceStatus;

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

export function filterTeamRosterMembers<T extends { status: WorkspaceStatus }>(
  members: T[],
  filter: TeamRosterFilter,
) {
  return filter === 'all'
    ? members
    : members.filter((member) => member.status === filter);
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
