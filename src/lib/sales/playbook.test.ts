import { describe, expect, it } from 'vitest';

import { leadStatuses } from '../dashboard/types';
import { getLeadStatusDefinition, leadStatusDefinitions } from './playbook';

describe('sales lead status playbook', () => {
  it('defines every persisted status exactly once', () => {
    expect(leadStatusDefinitions.map(({ status }) => status)).toEqual(leadStatuses);
    expect(new Set(leadStatusDefinitions.map(({ status }) => status)).size).toBe(
      leadStatuses.length,
    );
  });

  it('distinguishes spam from a legitimate lead that is not ready', () => {
    expect(getLeadStatusDefinition('spam').useWhen).toContain(
      'Do not use Spam for a valid prospect',
    );
  });

  it('requires evidence before qualification', () => {
    expect(getLeadStatusDefinition('qualified').useWhen).toContain('budget confidence');
  });
});
