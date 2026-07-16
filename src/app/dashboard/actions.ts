'use server';

import { revalidatePath } from 'next/cache';

import {
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

  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: getPersistenceMessage(persisted, 'Lead status update'),
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

export async function markLeadContacted(leadId: string): Promise<DashboardActionResult> {
  requireLeadId(leadId);
  const persisted = await updateSupabaseLead(leadId, { status: 'contacted' });

  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: getPersistenceMessage(persisted, 'Contact timestamp update'),
  };
}

export async function markLeadSpam(leadId: string): Promise<DashboardActionResult> {
  requireLeadId(leadId);
  const persisted = await updateSupabaseLead(leadId, { status: 'spam' });

  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: getPersistenceMessage(persisted, 'Spam classification'),
  };
}
