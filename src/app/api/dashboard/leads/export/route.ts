import { getLeadExportRows } from '@/lib/dashboard/queries';

export const dynamic = 'force-dynamic';

function escapeCsvValue(value: string | number) {
  const stringValue = String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export async function GET() {
  const rows = await getLeadExportRows();
  const headers = [
    'id',
    'created_at',
    'name',
    'email',
    'company',
    'website',
    'status',
    'source',
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
    },
  });
}
