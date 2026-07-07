'use server';

import { revalidatePath } from 'next/cache';

import {
  insertSupabaseLeadEvent,
  insertSupabaseLeadNote,
  updateSupabaseLead,
} from '@/lib/dashboard/supabase-repository';
import {
  type DashboardActionResult,
  type LeadStatus,
  leadStatuses,
} from '@/lib/dashboard/types';

function requireLeadId(leadId: string) {
  if (!leadId.trim()) {
    throw new Error('Missing lead id');
  }
}

function parseStatus(status: string): LeadStatus {
  if (!leadStatuses.includes(status as LeadStatus)) {
    throw new Error('Invalid lead status');
  }

  return status as LeadStatus;
}

function refreshDashboardLeadViews(leadId: string) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/leads');
  revalidatePath(`/dashboard/leads/${leadId}`);
}

function getPersistenceMessage(persisted: boolean, action: string) {
  return persisted
    ? `${action} saved to Supabase.`
    : `${action} validated, but Supabase server credentials are not configured.`;
}

export async function submitQuickAuditLead(): Promise<DashboardActionResult> {
  return {
    ok: true,
    message: 'Quick-start lead submission is prepared for Supabase wiring.',
  };
}

export async function submitPlatformAudit(): Promise<DashboardActionResult> {
  return {
    ok: true,
    message: 'Platform audit submission is prepared for Supabase wiring.',
  };
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<DashboardActionResult> {
  requireLeadId(leadId);
  const nextStatus = parseStatus(status);
  const persisted = await updateSupabaseLead(leadId, { status: nextStatus });

  if (persisted) {
    await insertSupabaseLeadEvent(leadId, 'lead_status_changed', {
      status: nextStatus,
    });
  }

  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: getPersistenceMessage(persisted, 'Lead status update'),
  };
}

export async function assignLeadOwner(
  leadId: string,
  ownerUserId: string,
): Promise<DashboardActionResult> {
  requireLeadId(leadId);

  if (!ownerUserId.trim()) {
    throw new Error('Missing owner id');
  }

  const persisted = await updateSupabaseLead(leadId, {
    owner_user_id: ownerUserId === 'unassigned' ? null : ownerUserId,
  });

  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: getPersistenceMessage(persisted, 'Lead owner assignment'),
  };
}

export async function addLeadNote(formData: FormData): Promise<DashboardActionResult> {
  const leadId = String(formData.get('leadId') ?? '');
  const body = String(formData.get('body') ?? '').trim();

  requireLeadId(leadId);

  if (!body) {
    throw new Error('Missing note body');
  }

  const persisted = await insertSupabaseLeadNote(leadId, body);

  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: getPersistenceMessage(persisted, 'Lead note'),
  };
}

export async function updateLeadQualification(
  leadId: string,
  qualificationScore: number,
): Promise<DashboardActionResult> {
  requireLeadId(leadId);

  if (qualificationScore < 0 || qualificationScore > 100) {
    throw new Error('Qualification score must be between 0 and 100');
  }

  const persisted = await updateSupabaseLead(leadId, {
    qualification_score: qualificationScore,
  });

  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: getPersistenceMessage(persisted, 'Qualification update'),
  };
}

export async function markLeadContacted(leadId: string): Promise<DashboardActionResult> {
  requireLeadId(leadId);
  const persisted = await updateSupabaseLead(leadId, {
    last_contacted_at: new Date().toISOString(),
  });

  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: getPersistenceMessage(persisted, 'Contact timestamp update'),
  };
}

export async function archiveLead(leadId: string): Promise<DashboardActionResult> {
  requireLeadId(leadId);
  const persisted = await updateSupabaseLead(leadId, { status: 'archived' });

  if (persisted) {
    await insertSupabaseLeadEvent(leadId, 'lead_status_changed', {
      status: 'archived',
    });
  }

  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: getPersistenceMessage(persisted, 'Lead archive action'),
  };
}
