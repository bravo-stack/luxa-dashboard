'use server';

import { revalidatePath } from 'next/cache';

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
  parseStatus(status);
  refreshDashboardLeadViews(leadId);

  return {
    ok: true,
    message: 'Lead status update is ready for Supabase persistence.',
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

  refreshDashboardLeadViews(leadId);

  return {
    ok: true,
    message: 'Lead owner assignment is ready for Supabase persistence.',
  };
}

export async function addLeadNote(formData: FormData): Promise<DashboardActionResult> {
  const leadId = String(formData.get('leadId') ?? '');
  const body = String(formData.get('body') ?? '').trim();

  requireLeadId(leadId);

  if (!body) {
    throw new Error('Missing note body');
  }

  refreshDashboardLeadViews(leadId);

  return {
    ok: true,
    message: 'Lead note is ready for Supabase persistence.',
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

  refreshDashboardLeadViews(leadId);

  return {
    ok: true,
    message: 'Qualification update is ready for Supabase persistence.',
  };
}

export async function markLeadContacted(leadId: string): Promise<DashboardActionResult> {
  requireLeadId(leadId);
  refreshDashboardLeadViews(leadId);

  return {
    ok: true,
    message: 'Contact timestamp update is ready for Supabase persistence.',
  };
}

export async function archiveLead(leadId: string): Promise<DashboardActionResult> {
  requireLeadId(leadId);
  refreshDashboardLeadViews(leadId);

  return {
    ok: true,
    message: 'Lead archive action is ready for Supabase persistence.',
  };
}
