import type { WorkspaceStatus } from '@/lib/auth/types';

import type { LeadListItem } from './types';

export type SalesLeadCreator = {
  id: string;
  displayName: string;
  email: string;
  status: WorkspaceStatus;
};

export type SalesLeadGroup = {
  member: SalesLeadCreator;
  leads: LeadListItem[];
};

export function partitionAdminLeadWorkspace(
  leads: LeadListItem[],
  salesMembers: SalesLeadCreator[],
) {
  const salesMembersById = new Map(salesMembers.map((member) => [member.id, member]));
  const salesLeadGroups = new Map<string, SalesLeadGroup>(
    salesMembers.map((member) => [member.id, { member, leads: [] }]),
  );
  const adminLeads: LeadListItem[] = [];

  leads.forEach((lead) => {
    const creator = lead.created_by ? salesMembersById.get(lead.created_by) : undefined;

    if (!creator) {
      adminLeads.push(lead);
      return;
    }

    salesLeadGroups.get(creator.id)?.leads.push(lead);
  });

  return {
    adminLeads,
    salesLeadGroups: Array.from(salesLeadGroups.values()).sort((first, second) => {
      const leadDifference = second.leads.length - first.leads.length;
      return (
        leadDifference ||
        first.member.displayName.localeCompare(second.member.displayName)
      );
    }),
  };
}
