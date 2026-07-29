import 'server-only';

import type { WorkspaceUser } from '@/lib/auth/types';
import { isMissingWorkspaceTable } from '@/lib/auth/workspace';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

import type {
  FeedbackCategory,
  FeedbackImpact,
  FeedbackItem,
  FeedbackOverview,
  FeedbackStatus,
} from './types';

const feedbackSelect =
  'id,created_at,updated_at,submitted_by,submitted_by_name,submitted_by_email,category,impact,title,description,expected_outcome,page_path,status,admin_note,reviewed_at';

function normalizeFeedback(row: Record<string, unknown>): FeedbackItem {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    submittedBy: String(row.submitted_by),
    submitterName: String(row.submitted_by_name),
    submitterEmail: String(row.submitted_by_email),
    category: row.category as FeedbackCategory,
    impact: row.impact as FeedbackImpact,
    title: String(row.title),
    description: String(row.description),
    expectedOutcome: row.expected_outcome ? String(row.expected_outcome) : null,
    pagePath: row.page_path ? String(row.page_path) : null,
    status: row.status as FeedbackStatus,
    adminNote: row.admin_note ? String(row.admin_note) : null,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
  };
}

export async function getFeedbackOverview(
  user: WorkspaceUser,
  requestedPage = 1,
): Promise<FeedbackOverview> {
  const supabase = getSupabaseAdminClient();
  const pageSize = user.role === 'admin' ? 50 : 30;
  const page = Math.max(1, Math.floor(requestedPage));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from('workspace_feedback')
    .select(feedbackSelect, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (user.role === 'sales_exec') {
    query = query.eq('submitted_by', user.id);
  }

  let newCountQuery = supabase
    .from('workspace_feedback')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new');
  let blockingCountQuery = supabase
    .from('workspace_feedback')
    .select('id', { count: 'exact', head: true })
    .eq('impact', 'blocking')
    .not('status', 'in', '(resolved,closed)');
  let resolvedCountQuery = supabase
    .from('workspace_feedback')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'resolved');

  if (user.role === 'sales_exec') {
    newCountQuery = newCountQuery.eq('submitted_by', user.id);
    blockingCountQuery = blockingCountQuery.eq('submitted_by', user.id);
    resolvedCountQuery = resolvedCountQuery.eq('submitted_by', user.id);
  }

  const [listResult, newResult, blockingResult, resolvedResult] = await Promise.all([
    query,
    newCountQuery,
    blockingCountQuery,
    resolvedCountQuery,
  ]);
  const { data, error, count } = listResult;

  if (error) {
    if (isMissingWorkspaceTable(error)) {
      return {
        items: [],
        page: 1,
        total: 0,
        totalPages: 1,
        metrics: { total: 0, new: 0, blocking: 0, resolved: 0 },
        dataReady: false,
      };
    }

    throw new Error(`Workspace feedback query failed: ${error.message}`);
  }

  const metricError = [newResult, blockingResult, resolvedResult].find(
    (result) => result.error,
  )?.error;

  if (metricError) {
    throw new Error(`Workspace feedback metric query failed: ${metricError.message}`);
  }

  const items = ((data ?? []) as unknown as Record<string, unknown>[]).map(
    normalizeFeedback,
  );
  const total = count ?? 0;

  return {
    items,
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    metrics: {
      total,
      new: newResult.count ?? 0,
      blocking: blockingResult.count ?? 0,
      resolved: resolvedResult.count ?? 0,
    },
    dataReady: true,
  };
}

export async function insertWorkspaceFeedback(input: {
  submittedBy: string;
  submitterName: string;
  submitterEmail: string;
  category: FeedbackCategory;
  impact: FeedbackImpact;
  title: string;
  description: string;
  expectedOutcome?: string;
  pagePath?: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('workspace_feedback')
    .insert({
      submitted_by: input.submittedBy,
      submitted_by_name: input.submitterName,
      submitted_by_email: input.submitterEmail,
      category: input.category,
      impact: input.impact,
      title: input.title,
      description: input.description,
      expected_outcome: input.expectedOutcome || null,
      page_path: input.pagePath || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return String(data.id);
}

export async function updateWorkspaceFeedback(input: {
  id: string;
  status: FeedbackStatus;
  adminNote?: string;
  reviewedBy: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('workspace_feedback')
    .update({
      status: input.status,
      admin_note: input.adminNote || null,
      reviewed_by: input.reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}
