import { describe, expect, it } from 'vitest';

import {
  filterTeamRosterMembers,
  getTeamRosterCounts,
  isTeamRosterFilter,
} from './team-roster-filter';

const members = [
  { id: 'admin', status: 'active' as const },
  { id: 'pending', status: 'invited' as const },
  { id: 'sales', status: 'active' as const },
  { id: 'frozen', status: 'frozen' as const },
];

describe('team roster status filters', () => {
  it('returns the complete roster or only the selected status', () => {
    expect(filterTeamRosterMembers(members, 'all')).toEqual(members);
    expect(filterTeamRosterMembers(members, 'active').map((member) => member.id)).toEqual(
      ['admin', 'sales'],
    );
    expect(
      filterTeamRosterMembers(members, 'invited').map((member) => member.id),
    ).toEqual(['pending']);
    expect(filterTeamRosterMembers(members, 'frozen').map((member) => member.id)).toEqual(
      ['frozen'],
    );
  });

  it('reports a count for every filter, including empty states', () => {
    expect(getTeamRosterCounts(members)).toEqual({
      all: 4,
      active: 2,
      invited: 1,
      frozen: 1,
    });
    expect(getTeamRosterCounts([])).toEqual({
      all: 0,
      active: 0,
      invited: 0,
      frozen: 0,
    });
  });

  it('accepts only supported filter values', () => {
    expect(isTeamRosterFilter('active')).toBe(true);
    expect(isTeamRosterFilter('suspended')).toBe(false);
  });
});
