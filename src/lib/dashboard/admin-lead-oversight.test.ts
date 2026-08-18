import { describe, expect, it } from 'vitest';

import { partitionAdminLeadWorkspace } from './admin-lead-oversight';
import type { LeadListItem } from './types';

function lead(id: string, createdBy?: string): LeadListItem {
  return {
    id,
    created_at: '2026-08-18T08:00:00.000Z',
    updated_at: '2026-08-18T08:00:00.000Z',
    name: `Lead ${id}`,
    email: `${id}@example.com`,
    company: `Company ${id}`,
    projectType: 'Website redesign',
    status: 'new',
    origin: createdBy ? 'manual' : 'website',
    created_by: createdBy,
    owner_user_id: createdBy,
    locale: 'en',
    pathname: '/dashboard/leads/new',
    priority: 'review_next',
    submissions: [],
  };
}

describe('partitionAdminLeadWorkspace', () => {
  it('keeps admin and inbound leads separate from sales-authored leads', () => {
    const result = partitionAdminLeadWorkspace(
      [lead('inbound'), lead('admin', 'admin-1'), lead('sales', 'sales-1')],
      [
        {
          id: 'sales-1',
          displayName: 'Ada Sales',
          email: 'ada@example.com',
          status: 'active',
        },
      ],
    );

    expect(result.adminLeads.map((item) => item.id)).toEqual(['inbound', 'admin']);
    expect(result.salesLeadGroups[0]!.leads.map((item) => item.id)).toEqual(['sales']);
  });

  it('keeps executives with no authored leads visible for oversight', () => {
    const result = partitionAdminLeadWorkspace(
      [],
      [
        {
          id: 'sales-1',
          displayName: 'Ada Sales',
          email: 'ada@example.com',
          status: 'invited',
        },
      ],
    );

    expect(result.salesLeadGroups).toHaveLength(1);
    expect(result.salesLeadGroups[0]!.leads).toEqual([]);
  });
});
