'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/admin';
import {
  deleteSupabaseLeadNote,
  insertSupabaseLeadNote,
  insertSupabaseManualLead,
  updateSupabaseLead,
  updateSupabaseLeadNote,
} from '@/lib/dashboard/supabase-repository';
import {
  type ConnectionStatus,
  connectionStatuses,
  type DashboardActionResult,
  type LeadStatus,
  leadStatuses,
} from '@/lib/dashboard/types';
import { normalizeHttpUrl } from '@/lib/dashboard/urls';

export type CreateLeadState = {
  message: string;
  errors?: Partial<
    Record<
      | 'fullName'
      | 'email'
      | 'company'
      | 'projectType'
      | 'website'
      | 'linkedinProfileUrl'
      | 'focusLinkedinUrl'
      | 'facebookUrl',
      string
    >
  >;
};

export type ProspectingState = CreateLeadState;

function normalizeOptionalValue(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? '').trim();
  return value || undefined;
}

function normalizeConnectionStatus(value: FormDataEntryValue | null) {
  const status = String(value ?? '');

  return connectionStatuses.includes(status as ConnectionStatus)
    ? (status as ConnectionStatus)
    : undefined;
}

export async function createLead(
  _state: CreateLeadState,
  formData: FormData,
): Promise<CreateLeadState> {
  const user = await requireAdmin();
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const company = String(formData.get('company') ?? '').trim();
  const projectType = String(formData.get('projectType') ?? '').trim();
  const website = normalizeHttpUrl(normalizeOptionalValue(formData, 'website'));
  const linkedinProfileUrl = normalizeHttpUrl(
    normalizeOptionalValue(formData, 'linkedinProfileUrl'),
  );
  const focusLinkedinUrl = normalizeHttpUrl(
    normalizeOptionalValue(formData, 'focusLinkedinUrl'),
  );
  const facebookUrl = normalizeHttpUrl(normalizeOptionalValue(formData, 'facebookUrl'));
  const errors: NonNullable<CreateLeadState['errors']> = {};

  if (!fullName) errors.fullName = 'Enter the lead’s full name.';
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (!company) errors.company = 'Enter the company or organization.';
  if (!projectType) errors.projectType = 'Describe the opportunity or project.';
  if (website === null) errors.website = 'Enter a valid website address.';
  if (linkedinProfileUrl === null) {
    errors.linkedinProfileUrl = 'Enter a valid LinkedIn URL.';
  }
  if (focusLinkedinUrl === null) {
    errors.focusLinkedinUrl = 'Enter a valid LinkedIn URL.';
  }
  if (facebookUrl === null) errors.facebookUrl = 'Enter a valid Facebook URL.';

  if (Object.keys(errors).length) {
    return { message: 'Review the highlighted fields.', errors };
  }

  const localeValue = String(formData.get('locale') ?? 'en');
  let leadId: string;

  try {
    leadId = await insertSupabaseManualLead(
      {
        fullName,
        email,
        company,
        projectType,
        website: website || undefined,
        icpCategory: normalizeOptionalValue(formData, 'icpCategory'),
        linkedinProfileUrl: linkedinProfileUrl || undefined,
        focusName: normalizeOptionalValue(formData, 'focusName'),
        focusTitle: normalizeOptionalValue(formData, 'focusTitle'),
        focusLinkedinUrl: focusLinkedinUrl || undefined,
        connectionStatus: normalizeConnectionStatus(formData.get('connectionStatus')),
        lastOutreachDate: normalizeOptionalValue(formData, 'lastOutreachDate'),
        nextFollowUpAction: normalizeOptionalValue(formData, 'nextFollowUpAction'),
        painPoints: normalizeOptionalValue(formData, 'painPoints'),
        facebookUrl: facebookUrl || undefined,
        whatsapp: normalizeOptionalValue(formData, 'whatsapp'),
        locale: localeValue === 'ar' ? 'ar' : 'en',
        industry: normalizeOptionalValue(formData, 'industry'),
        budget: normalizeOptionalValue(formData, 'budget'),
        timeline: normalizeOptionalValue(formData, 'timeline'),
        context: normalizeOptionalValue(formData, 'context'),
        nextStep: normalizeOptionalValue(formData, 'nextStep'),
      },
      user.id,
    );
  } catch (error) {
    console.error('Failed to create manual lead', error);
    return {
      message:
        'The lead could not be created. Your entries are still here; check the connection and try again.',
    };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/leads');
  redirect(`/dashboard/leads/${leadId}`);
}

export async function updateLeadProspecting(
  _state: ProspectingState,
  formData: FormData,
): Promise<ProspectingState> {
  await requireAdmin();
  const leadId = String(formData.get('leadId') ?? '').trim();
  requireLeadId(leadId);

  const linkedinProfileUrl = normalizeHttpUrl(
    normalizeOptionalValue(formData, 'linkedinProfileUrl'),
  );
  const focusLinkedinUrl = normalizeHttpUrl(
    normalizeOptionalValue(formData, 'focusLinkedinUrl'),
  );
  const facebookUrl = normalizeHttpUrl(normalizeOptionalValue(formData, 'facebookUrl'));
  const errors: NonNullable<ProspectingState['errors']> = {};

  if (linkedinProfileUrl === null) {
    errors.linkedinProfileUrl = 'Enter a valid LinkedIn URL.';
  }
  if (focusLinkedinUrl === null) {
    errors.focusLinkedinUrl = 'Enter a valid LinkedIn URL.';
  }
  if (facebookUrl === null) errors.facebookUrl = 'Enter a valid Facebook URL.';

  if (Object.keys(errors).length) {
    return { message: 'Review the highlighted fields.', errors };
  }

  let persisted: boolean;

  try {
    persisted = await updateSupabaseLead(leadId, {
      icpCategory: normalizeOptionalValue(formData, 'icpCategory') ?? '',
      linkedinProfileUrl: linkedinProfileUrl || '',
      focusName: normalizeOptionalValue(formData, 'focusName') ?? '',
      focusTitle: normalizeOptionalValue(formData, 'focusTitle') ?? '',
      focusLinkedinUrl: focusLinkedinUrl || '',
      connectionStatus: normalizeConnectionStatus(formData.get('connectionStatus')),
      lastOutreachDate: normalizeOptionalValue(formData, 'lastOutreachDate') ?? '',
      nextFollowUpAction: normalizeOptionalValue(formData, 'nextFollowUpAction') ?? '',
      painPoints: normalizeOptionalValue(formData, 'painPoints') ?? '',
      facebookUrl: facebookUrl || '',
      whatsapp: normalizeOptionalValue(formData, 'whatsapp') ?? '',
    });
  } catch (error) {
    console.error('Failed to update lead prospecting details', error);
    return {
      message:
        'The prospecting details could not be saved. Your entries are still here; try again.',
    };
  }

  refreshDashboardLeadViews(leadId);

  return {
    message: persisted ? 'Prospecting details saved.' : 'Lead not found.',
    ...(persisted ? {} : { errors: {} }),
  };
}

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

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<DashboardActionResult> {
  await requireAdmin();
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
  const user = await requireAdmin();
  const leadId = String(formData.get('leadId') ?? '');
  const body = String(formData.get('body') ?? '').trim();

  requireLeadId(leadId);

  if (!body) {
    throw new Error('Missing note body');
  }

  if (body.length > 5000) {
    throw new Error('Notes must be 5,000 characters or fewer');
  }

  let persisted: boolean;

  try {
    persisted = await insertSupabaseLeadNote(leadId, body, user.id);
  } catch (error) {
    console.error('Failed to add lead note', error);
    return { ok: false, message: 'The note could not be added. Try again.' };
  }

  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: getPersistenceMessage(persisted, 'Lead note'),
  };
}

export async function updateLeadNote(formData: FormData): Promise<DashboardActionResult> {
  await requireAdmin();
  const leadId = String(formData.get('leadId') ?? '');
  const noteId = String(formData.get('noteId') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();

  requireLeadId(leadId);

  if (!noteId) throw new Error('Missing note id');
  if (!body) throw new Error('Missing note body');
  if (body.length > 5000) throw new Error('Notes must be 5,000 characters or fewer');

  let persisted: boolean;

  try {
    persisted = await updateSupabaseLeadNote(leadId, noteId, body);
  } catch (error) {
    console.error('Failed to update lead note', error);
    return { ok: false, message: 'The note could not be updated. Try again.' };
  }
  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: persisted ? 'Note updated.' : 'Note not found.',
  };
}

export async function deleteLeadNote(formData: FormData): Promise<DashboardActionResult> {
  await requireAdmin();
  const leadId = String(formData.get('leadId') ?? '');
  const noteId = String(formData.get('noteId') ?? '').trim();

  requireLeadId(leadId);
  if (!noteId) throw new Error('Missing note id');

  let persisted: boolean;

  try {
    persisted = await deleteSupabaseLeadNote(leadId, noteId);
  } catch (error) {
    console.error('Failed to delete lead note', error);
    return { ok: false, message: 'The note could not be deleted. Try again.' };
  }
  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: persisted ? 'Note deleted.' : 'Note not found.',
  };
}

export async function markLeadContacted(leadId: string): Promise<DashboardActionResult> {
  await requireAdmin();
  requireLeadId(leadId);
  const persisted = await updateSupabaseLead(leadId, { status: 'contacted' });

  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: getPersistenceMessage(persisted, 'Contact timestamp update'),
  };
}

export async function markLeadSpam(leadId: string): Promise<DashboardActionResult> {
  await requireAdmin();
  requireLeadId(leadId);
  const persisted = await updateSupabaseLead(leadId, { status: 'spam' });

  refreshDashboardLeadViews(leadId);

  return {
    ok: persisted,
    message: getPersistenceMessage(persisted, 'Spam classification'),
  };
}
