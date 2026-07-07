import Link from 'next/link';
import { Download, FileCheck2, MailQuestion, TrendingUp, UsersRound } from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { InsightCard } from '@/components/dashboard/insight-card';
import { LeadTable } from '@/components/leads/lead-table';
import { Button } from '@/components/ui/button';
import { getLeads } from '@/lib/dashboard/queries';
import { isAwaitingReply, isQualifiedLead } from '@/lib/dashboard/utils';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const leads = await getLeads();
  const fullAuditCount = leads.filter((lead) =>
    lead.submissions.some((submission) => submission.submission_type === 'full_audit'),
  ).length;

  return (
    <>
      <DashboardHeader
        eyebrow="Lead operations"
        title="Lead management"
        description="Search, qualify, assign, and move Luxa leads through the follow-up queue without losing audit context."
        actions={
          <>
            <DateRangePicker />
            <Button asChild>
              <Link href="/api/dashboard/leads/export">
                <Download className="size-4" />
                Export leads
              </Link>
            </Button>
          </>
        }
      />
      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        aria-label="Lead list summary"
      >
        <InsightCard
          title="Total active leads"
          value={leads.filter((lead) => lead.status !== 'archived').length}
          description="Includes new, qualified, contacted, scheduled, proposal, won, and lost records."
          icon={UsersRound}
          tone="primary"
        />
        <InsightCard
          title="Qualified leads"
          value={leads.filter(isQualifiedLead).length}
          description="Score meets the current Luxa qualification threshold."
          icon={TrendingUp}
          tone="warning"
        />
        <InsightCard
          title="Awaiting reply"
          value={leads.filter(isAwaitingReply).length}
          description="New or qualified leads with no contact timestamp."
          icon={MailQuestion}
          tone="neutral"
        />
        <InsightCard
          title="Full audits"
          value={fullAuditCount}
          description="Leads with deeper context ready for review."
          icon={FileCheck2}
          tone="success"
        />
      </section>
      <LeadTable leads={leads} />
    </>
  );
}
