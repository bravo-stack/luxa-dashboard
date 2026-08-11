import { describe, expect, it } from 'vitest';

import {
  filterTeamRosterMembers,
  getTeamRosterCounts,
  isTeamInviteDateFilter,
  isTeamRosterFilter,
  paginateTeamRosterMembers,
} from './team-roster-filter';

const referenceTime = new Date('2026-08-11T12:00:00.000Z').getTime();
const members = [
  { id: 'admin', status: 'active' as const, invitedAt: null },
  {
    id: 'pending',
    status: 'invited' as const,
    invitedAt: '2026-08-11T06:00:00.000Z',
  },
  {
    id: 'sales',
    status: 'active' as const,
    invitedAt: '2026-08-02T12:00:00.000Z',
  },
  {
    id: 'frozen',
    status: 'frozen' as const,
    invitedAt: '2026-06-01T12:00:00.000Z',
  },
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

  it('combines account status and invitation recency filters', () => {
    expect(
      filterTeamRosterMembers(members, 'all', 'last_24_hours', referenceTime).map(
        (member) => member.id,
      ),
    ).toEqual(['pending']);
    expect(
      filterTeamRosterMembers(members, 'active', 'last_30_days', referenceTime).map(
        (member) => member.id,
      ),
    ).toEqual(['sales']);
    expect(
      filterTeamRosterMembers(members, 'all', 'older_than_30_days', referenceTime).map(
        (member) => member.id,
      ),
    ).toEqual(['frozen']);
  });

  it('paginates filtered results and clamps invalid pages', () => {
    expect(paginateTeamRosterMembers(members, 1, 2)).toMatchObject({
      currentPage: 1,
      totalPages: 2,
      startIndex: 0,
      items: members.slice(0, 2),
    });
    expect(paginateTeamRosterMembers(members, 99, 2)).toMatchObject({
      currentPage: 2,
      startIndex: 2,
      items: members.slice(2),
    });
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
    expect(isTeamInviteDateFilter('last_7_days')).toBe(true);
    expect(isTeamInviteDateFilter('this_year')).toBe(false);
  });
});
