import type { LeadStatus } from './types';

async function getResponseError(response: Response, fallback: string) {
  const result = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) throw new Error(result?.error ?? fallback);
}

export async function persistLeadStatus(
  leadId: string,
  status: LeadStatus,
  outcomeReason?: string,
) {
  const response = await fetch(`/api/dashboard/leads/${encodeURIComponent(leadId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, outcomeReason }),
  });

  await getResponseError(response, `Status update failed (${response.status})`);
}

export async function claimLead(leadId: string) {
  const response = await fetch(
    `/api/dashboard/leads/${encodeURIComponent(leadId)}/claim`,
    { method: 'POST' },
  );
  await getResponseError(response, `Lead claim failed (${response.status})`);
}

export async function requestLeadDeletion(leadId: string, reason: string) {
  const response = await fetch(
    `/api/dashboard/leads/${encodeURIComponent(leadId)}/deletion-request`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    },
  );
  await getResponseError(response, `Deletion request failed (${response.status})`);
}

export async function reviewLeadDeletion(
  requestId: string,
  decision: 'approved' | 'rejected',
  note: string,
) {
  const response = await fetch(
    `/api/dashboard/leads/deletion-requests/${encodeURIComponent(requestId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, note }),
    },
  );
  await getResponseError(response, `Deletion review failed (${response.status})`);
}
