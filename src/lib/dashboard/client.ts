import type { LeadStatus } from './types';

export async function persistLeadStatus(leadId: string, status: LeadStatus) {
  const response = await fetch(`/api/dashboard/leads/${encodeURIComponent(leadId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  const result = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(result?.error ?? `Status update failed (${response.status})`);
  }
}
