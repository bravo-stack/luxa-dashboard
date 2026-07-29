import { getAdminUser } from '@/lib/auth/admin';
import { escapeCsvValue } from '@/lib/dashboard/csv';
import { getLeadExportRows } from '@/lib/dashboard/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await getAdminUser())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await getLeadExportRows();
  const headers = [
    'id',
    'created_at',
    'name',
    'email',
    'company',
    'website',
    'icp_category',
    'linkedin_profile_url',
    'focus_name',
    'focus_title',
    'focus_linkedin_url',
    'connection_status',
    'last_outreach_date',
    'next_follow_up_action',
    'pain_points',
    'facebook_url',
    'whatsapp',
    'status',
    'origin',
    'created_by',
    'owner_user_id',
    'marketing_source',
    'locale',
    'pathname',
    'form_type',
    'project_type',
    'industry',
    'budget_range',
    'timeline',
  ] as const;
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(',')),
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="luxa-leads.csv"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
