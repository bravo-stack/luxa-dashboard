'use server';

import { revalidatePath } from 'next/cache';

import { requirePermission } from '@/lib/auth/workspace';
import {
  insertWorkspaceFeedback,
  updateWorkspaceFeedback,
} from '@/lib/feedback/repository';
import {
  feedbackCategories,
  type FeedbackCategory,
  type FeedbackImpact,
  feedbackImpacts,
  type FeedbackStatus,
  feedbackStatuses,
} from '@/lib/feedback/types';

export type FeedbackActionState = {
  message: string;
  success?: boolean;
  errors?: Partial<
    Record<'category' | 'impact' | 'title' | 'description' | 'expectedOutcome', string>
  >;
};

export type FeedbackTriageState = {
  message: string;
  success?: boolean;
};

function normalizeText(formData: FormData, name: string, maxLength: number) {
  return String(formData.get(name) ?? '')
    .trim()
    .slice(0, maxLength);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function submitFeedback(
  _state: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const user = await requirePermission('feedback.submit');
  const category = String(formData.get('category') ?? '') as FeedbackCategory;
  const impact = String(formData.get('impact') ?? '') as FeedbackImpact;
  const title = normalizeText(formData, 'title', 120);
  const description = normalizeText(formData, 'description', 4000);
  const expectedOutcome = normalizeText(formData, 'expectedOutcome', 2000);
  const rawPagePath = normalizeText(formData, 'pagePath', 500);
  const pagePath = rawPagePath.startsWith('/dashboard') ? rawPagePath : undefined;
  const errors: NonNullable<FeedbackActionState['errors']> = {};

  if (!feedbackCategories.includes(category)) {
    errors.category = 'Choose a feedback type.';
  }
  if (!feedbackImpacts.includes(impact)) {
    errors.impact = 'Choose how this affects your work.';
  }
  if (title.length < 4) {
    errors.title = 'Use a specific title of at least four characters.';
  }
  if (description.length < 10) {
    errors.description = 'Describe what happened or what should change.';
  }

  if (Object.keys(errors).length) {
    return { message: 'Review the highlighted fields.', errors };
  }

  try {
    await insertWorkspaceFeedback({
      submittedBy: user.id,
      submitterName: user.displayName,
      submitterEmail: user.email,
      category,
      impact,
      title,
      description,
      expectedOutcome: expectedOutcome || undefined,
      pagePath,
    });
  } catch (error) {
    console.error('Workspace feedback submission failed', error);
    return {
      message:
        'Your feedback could not be saved. Your entries are still here; try again.',
    };
  }

  revalidatePath('/dashboard/feedback');

  return {
    message: 'Feedback submitted. The workspace administrator can now review it.',
    success: true,
  };
}

export async function updateFeedbackTriage(
  _state: FeedbackTriageState,
  formData: FormData,
): Promise<FeedbackTriageState> {
  const admin = await requirePermission('feedback.manage');
  const id = String(formData.get('feedbackId') ?? '').trim();
  const status = String(formData.get('status') ?? '') as FeedbackStatus;
  const adminNote = normalizeText(formData, 'adminNote', 2000);

  if (!isUuid(id) || !feedbackStatuses.includes(status)) {
    return { message: 'Choose a valid feedback item and status.' };
  }

  try {
    const persisted = await updateWorkspaceFeedback({
      id,
      status,
      adminNote: adminNote || undefined,
      reviewedBy: admin.id,
    });

    if (!persisted) return { message: 'That feedback item no longer exists.' };
  } catch (error) {
    console.error('Workspace feedback triage failed', error);
    return { message: 'The triage update could not be saved. Try again.' };
  }

  revalidatePath('/dashboard/feedback');

  return { message: 'Feedback triage updated.', success: true };
}
