import { Suspense } from 'react';
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
import {
  getDashboardAnalytics,
  getLeadFunnelSummary,
  getTrafficSummary,
  normalizeAnalyticsFilters,
} from '@/lib/analytics/server';
import type { DateRangeKey } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';

const metricIcons = [UserRound, MousePointerClick, Send, FileCheck2, CalendarCheck, Mail];

type AnalyticsPageProps = {
  searchParams?: Promise<{
    range?: string;
    project?: string;
    funnel?: string;
  }>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const filters = normalizeAnalyticsFilters({
    dateRange: params?.range as DateRangeKey,
    project: params?.project,
    funnel: params?.funnel,
  });
  const [analytics, traffic, leadFunnel] = await Promise.all([
    getDashboardAnalytics(filters),
    getTrafficSummary(filters),
    getLeadFunnelSummary(filters),
  ]);

  return (
    <>
      <DashboardHeader
        title="Funnel intelligence"
        description="Track CTA behavior, audit conversion, route performance, and attribution signals without exposing private lead details."
        actions={
          <>
            <Suspense
              fallback={
                <div className="h-11 w-48 rounded-md border border-border bg-muted/35" />
              }
            >
              <DateRangePicker defaultValue={filters.dateRange} />
            </Suspense>
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
        <FunnelCard steps={leadFunnel.funnel} />
        <AnalyticsChartCard
          title="Daily visitors"
          description="Traffic depth by day with no PII attached."
          data={traffic.dailyVisitors}
          variant="line"
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-2" aria-label="Trend cards">
        <AnalyticsChartCard
          title="Daily submissions"
          description="Quick-start and full audit submissions by day."
          data={traffic.dailySubmissions}
          variant="bar"
        />
        <AnalyticsChartCard
          title="Daily schedule clicks"
          description="Booked-intent clicks across audit success and booking paths."
          data={traffic.dailyScheduleClicks}
          variant="bar"
        />
        <AnalyticsChartCard
          title="Daily conversion rate"
          description="Visitor to lead conversion rate by day."
          data={traffic.dailyConversionRate}
          variant="line"
          valueSuffix="%"
        />
        <AnalyticsChartCard
          title="CTA clicks by source"
          description="Allowed CTA source values only, backed by provider-neutral telemetry."
          data={traffic.ctaClicksBySource}
          variant="bar"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2" aria-label="Audit breakdowns">
        <AnalyticsChartCard
          title="Submissions by project type"
          description="Demand themes that should shape discovery and proposal packaging."
          data={leadFunnel.submissionsByProjectType}
          variant="bar"
        />
        <AnalyticsChartCard
          title="Submissions by industry"
          description="Industry segments submitting audit data in the selected range."
          data={leadFunnel.submissionsByIndustry}
          variant="bar"
        />
        <AnalyticsChartCard
          title="Submissions by budget"
          description="Budget ranges captured through audit submissions."
          data={leadFunnel.submissionsByBudget}
          variant="bar"
        />
        <AnalyticsChartCard
          title="Submissions by timeline"
          description="Urgency profile for operational follow-up."
          data={leadFunnel.submissionsByTimeline}
          variant="bar"
        />
      </section>

      <SourcePerformance
        routes={traffic.topLandingPages}
        ctaSources={traffic.ctaClicksBySource}
        campaigns={traffic.utmCampaignPerformance}
        referrers={traffic.topReferrers}
        devices={traffic.deviceCategories}
      />
    </>
  );
}
