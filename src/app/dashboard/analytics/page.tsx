import Link from 'next/link';
import {
  CalendarCheck,
  Download,
  FileCheck2,
  Mail,
  MousePointerClick,
  Send,
  UserRound,
} from 'lucide-react';

import { AnalyticsChartCard } from '@/components/dashboard/analytics-chart-card';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { FunnelCard } from '@/components/dashboard/funnel-card';
import { MetricCard } from '@/components/dashboard/metric-card';
import { SourcePerformance } from '@/components/dashboard/source-performance';
import { Button } from '@/components/ui/button';
import { deviceCategories } from '@/lib/dashboard/mock-data';
import { getAnalyticsOverview } from '@/lib/dashboard/queries';

const metricIcons = [UserRound, MousePointerClick, Send, FileCheck2, CalendarCheck, Mail];

export default async function AnalyticsPage() {
  const analytics = await getAnalyticsOverview();

  return (
    <>
      <DashboardHeader
        eyebrow="Behavior analytics"
        title="Funnel intelligence"
        description="Track CTA behavior, audit conversion, route performance, and attribution signals without exposing private lead details."
        actions={
          <>
            <DateRangePicker defaultValue={analytics.dateRange.key} />
            <Button asChild variant="secondary">
              <Link href="/dashboard">
                <MousePointerClick className="size-4" />
                Overview
              </Link>
            </Button>
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
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
        aria-label="Analytics summary"
      >
        {analytics.metrics.map((metric, index) => {
          const Icon = metricIcons[index] ?? MousePointerClick;

          return (
            <MetricCard
              key={metric.key}
              metric={metric}
              icon={Icon}
              emphasis={index === 0}
            />
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <FunnelCard steps={analytics.funnel} />
        <AnalyticsChartCard
          title="Daily visitors"
          description="Traffic depth by day with no PII attached."
          data={analytics.dailyVisitors}
          variant="area"
          color="var(--chart-1)"
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-2" aria-label="Trend cards">
        <AnalyticsChartCard
          title="Daily submissions"
          description="Quick-start and full audit submissions by day."
          data={analytics.dailySubmissions}
          variant="bar"
          color="var(--chart-2)"
        />
        <AnalyticsChartCard
          title="Daily schedule clicks"
          description="Booked-intent clicks across audit success and booking paths."
          data={analytics.dailyScheduleClicks}
          variant="bar"
          color="var(--chart-3)"
        />
        <AnalyticsChartCard
          title="Daily conversion rate"
          description="Visitor to lead conversion rate by day."
          data={analytics.dailyConversionRate}
          variant="line"
          color="var(--chart-4)"
          valueSuffix="%"
        />
        <AnalyticsChartCard
          title="CTA clicks by source"
          description="Allowed CTA source values only, backed by provider-neutral telemetry."
          data={analytics.ctaClicksBySource}
          variant="bar"
          color="var(--chart-1)"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2" aria-label="Audit breakdowns">
        <AnalyticsChartCard
          title="Submissions by project type"
          description="Demand themes that should shape discovery and proposal packaging."
          data={analytics.submissionsByProjectType}
          variant="bar"
          color="var(--chart-2)"
        />
        <AnalyticsChartCard
          title="Submissions by industry"
          description="Industry segments submitting audit data in the selected range."
          data={analytics.submissionsByIndustry}
          variant="bar"
          color="var(--chart-3)"
        />
        <AnalyticsChartCard
          title="Submissions by budget"
          description="Budget ranges captured through audit submissions."
          data={analytics.submissionsByBudget}
          variant="bar"
          color="var(--chart-4)"
        />
        <AnalyticsChartCard
          title="Submissions by timeline"
          description="Urgency profile for operational follow-up."
          data={analytics.submissionsByTimeline}
          variant="bar"
          color="var(--chart-5)"
        />
      </section>

      <SourcePerformance
        routes={analytics.topLandingPages}
        ctaSources={analytics.ctaClicksBySource}
        campaigns={analytics.utmCampaignPerformance}
        referrers={analytics.topReferrers}
        devices={deviceCategories}
      />
    </>
  );
}
