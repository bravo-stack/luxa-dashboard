import { notFound } from 'next/navigation';

import { LeadAuditDetails } from '@/components/leads/lead-audit-details';
import { LeadDetailHeader } from '@/components/leads/lead-detail-header';
import { LeadNotes } from '@/components/leads/lead-notes';
import { LeadProspectingForm } from '@/components/leads/lead-prospecting-form';
import { LeadProspectingHistory } from '@/components/leads/lead-prospecting-history';
import { LeadQuickActions } from '@/components/leads/lead-quick-actions';
import { LeadSummaryCard } from '@/components/leads/lead-summary-card';
import { LeadTimeline } from '@/components/leads/lead-timeline';
import { getLeadDetail } from '@/lib/dashboard/queries';

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ historyPage?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const requestedHistoryPage = Number.parseInt(query.historyPage ?? '1', 10);
  const historyPage = Number.isFinite(requestedHistoryPage)
    ? Math.max(1, requestedHistoryPage)
    : 1;
  const detail = await getLeadDetail(id, historyPage);

  if (!detail) {
    notFound();
  }

  const latestSubmission = detail.submissions[0];

  return (
    <>
      <LeadDetailHeader lead={detail.lead} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <LeadSummaryCard lead={detail.lead} latestSubmission={latestSubmission} />
          <LeadProspectingForm lead={detail.lead} />
          <LeadProspectingHistory
            leadId={detail.lead.id}
            entries={detail.prospectingHistory}
            page={detail.prospectingHistoryPage}
            total={detail.prospectingHistoryTotal}
            totalPages={detail.prospectingHistoryTotalPages}
          />
          <LeadAuditDetails submissions={detail.submissions} />
          <LeadTimeline events={detail.events} />
          <LeadNotes leadId={detail.lead.id} notes={detail.notes} />
        </div>
        <LeadQuickActions lead={detail.lead} latestSubmission={latestSubmission} />
      </div>
    </>
  );
}
