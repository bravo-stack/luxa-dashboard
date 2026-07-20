import { Suspense } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  Eye,
  FormInput,
  ListChecks,
  Mail,
  MousePointerClick,
  Send,
} from 'lucide-react';

import { AnalyticsChartCard } from '@/components/dashboard/analytics-chart-card';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { FunnelCard } from '@/components/dashboard/funnel-card';
import { MetricCard } from '@/components/dashboard/metric-card';
import { SourcePerformance } from '@/components/dashboard/source-performance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getDashboardAnalytics,
  getLeadFunnelSummary,
  getTrafficSummary,
  normalizeAnalyticsFilters,
} from '@/lib/analytics/server';
import type { DateRangeKey } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';

const metricIcons = [Eye, FormInput, ListChecks, Send, CalendarCheck, Mail];

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
        title="Conversion intelligence"
        description="Read the privacy-safe Umami journey from page view to form submission and booked-call intent. No lead details enter analytics."
        actions={
          <>
            <Badge variant={analytics.source === 'umami' ? 'teal' : 'secondary'}>
              {analytics.source === 'umami' ? 'Live · Umami' : 'Preview data'}
            </Badge>
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
          </>
        }
      />

      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
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
          title="Daily page views"
          description="Explicit App Router page-view events by day."
          data={traffic.dailyVisitors}
          variant="line"
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-2" aria-label="Trend cards">
        <AnalyticsChartCard
          title="Daily form starts"
          description="First interaction with either lead form, counted once per form visit."
          data={traffic.dailyFormStarts}
          variant="bar"
        />
        <AnalyticsChartCard
          title="Daily submissions"
          description="Validated frontend success states across both forms."
          data={traffic.dailySubmissions}
          variant="bar"
        />
        <AnalyticsChartCard
          title="Daily book-call clicks"
          description="Scheduling intent across audit, calendar, and book-call paths."
          data={traffic.dailyScheduleClicks}
          variant="bar"
        />
        <AnalyticsChartCard
          title="Daily conversion rate"
          description="Page-view to validated-submission rate by day."
          data={traffic.dailyConversionRate}
          variant="line"
          valueSuffix="%"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2" aria-label="Behavior breakdowns">
        <AnalyticsChartCard
          title="Event mix"
          description="The complete controlled event catalogue observed in this range."
          data={traffic.eventVolume}
          variant="bar"
        />
        <AnalyticsChartCard
          title="Conversion placement"
          description="Where controlled book-call, email, pricing, and case-study interactions happen."
          data={traffic.ctaClicksBySource}
          variant="bar"
        />
        <AnalyticsChartCard
          title="Submissions by form"
          description="Platform audit and quick-start completions, with no submitted fields attached."
          data={leadFunnel.formPerformance}
          variant="bar"
        />
        <AnalyticsChartCard
          title="Submitted industries"
          description="Only the controlled industry value included in the event contract."
          data={leadFunnel.industryPerformance}
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
