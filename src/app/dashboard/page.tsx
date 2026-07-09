import { Suspense } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CalendarCheck,
  Download,
  FileCheck2,
  MailQuestion,
  Target,
  TrendingUp,
  UsersRound,
} from 'lucide-react';

import { AnalyticsChartCard } from '@/components/dashboard/analytics-chart-card';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { FunnelCard } from '@/components/dashboard/funnel-card';
import { InsightCard } from '@/components/dashboard/insight-card';
import { MetricCard } from '@/components/dashboard/metric-card';
import { NeedsAttention } from '@/components/dashboard/needs-attention';
import { RecentSubmissions } from '@/components/dashboard/recent-submissions';
import { SourcePerformance } from '@/components/dashboard/source-performance';
import { Button } from '@/components/ui/button';
import { getDashboardAnalytics, normalizeAnalyticsFilters } from '@/lib/analytics/server';
import type { DateRangeKey } from '@/lib/analytics/types';
import { getDashboardOverview } from '@/lib/dashboard/queries';
import type { MetricSummary, SourceSummary } from '@/lib/dashboard/types';

export const dynamic = 'force-dynamic';

type DashboardPageProps = {
  searchParams?: Promise<{
    range?: string;
    project?: string;
    funnel?: string;
  }>;
};

function findMetric(metrics: MetricSummary[], key: string) {
  return metrics.find((metric) => metric.key === key);
}

function sumValues(items: SourceSummary[]) {
  return items.reduce((total, item) => total + item.value, 0);
}

function getPointChange(items: SourceSummary[], suffix = '') {
  const latest = items.at(-1)?.value ?? 0;
  const previous = items.at(-2)?.value ?? latest;
  const change = latest - previous;

  if (change === 0) {
    return { trend: 'No movement', trendDirection: 'flat' as const };
  }

  return {
    trend: `${change > 0 ? '+' : ''}${change.toFixed(suffix ? 1 : 0)}${suffix} vs prior`,
    trendDirection: change > 0 ? ('up' as const) : ('down' as const),
  };
}

function buildPrimaryMetrics(metrics: MetricSummary[], conversionData: SourceSummary[]) {
  const visitors = findMetric(metrics, 'visitors');
  const fullAudits = findMetric(metrics, 'full_audit_submissions');
  const scheduleClicks = findMetric(metrics, 'schedule_clicks');
  const averageConversion =
    conversionData.length > 0
      ? conversionData.reduce((total, item) => total + item.value, 0) /
        conversionData.length
      : 0;
  const conversionChange = getPointChange(conversionData, 'pt');
  const conversionRate: MetricSummary = {
    key: 'conversion_rate',
    label: 'Conversion rate',
    value: `${averageConversion.toFixed(1)}%`,
    trend: conversionChange.trend,
    trendDirection: conversionChange.trendDirection,
    note: 'Visitor to lead',
  };

  return [visitors, conversionRate, fullAudits, scheduleClicks].filter(
    Boolean,
  ) as MetricSummary[];
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const filters = normalizeAnalyticsFilters({
    dateRange: params?.range as DateRangeKey,
    project: params?.project,
    funnel: params?.funnel,
  });
  const [overview, analytics] = await Promise.all([
    getDashboardOverview(filters.dateRange),
    getDashboardAnalytics(filters),
  ]);
  const primaryMetrics = buildPrimaryMetrics(
    analytics.metrics,
    analytics.dailyConversionRate,
  );
  const totalVisitors = sumValues(analytics.dailyVisitors);
  const totalSubmissions = sumValues(analytics.dailySubmissions);
  const conversionInsight =
    totalVisitors > 0
      ? `${totalSubmissions.toLocaleString()} leads from ${totalVisitors.toLocaleString()} visitors in ${overview.dateRange.label.toLowerCase()}.`
      : 'Traffic volume is not available for this range yet.';

  return (
    <>
      <DashboardHeader
        eyebrow={`${overview.dateRange.label} - ${analytics.source} analytics`}
        title="Growth dashboard"
        description="Understand traffic quality, conversion movement, source performance, and the follow-up work that needs attention."
        actions={
          <>
            <Suspense
              fallback={
                <div className="h-11 w-48 rounded-md border border-border bg-muted/35" />
              }
            >
              <DateRangePicker defaultValue={filters.dateRange} />
            </Suspense>
            <Button asChild variant="outline">
              <Link href="/dashboard/analytics">
                <BarChart3 className="size-4" />
                Deep dive
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

      <DashboardSection
        title="Executive readout"
        description="The few numbers that answer whether demand is increasing and turning into qualified intent."
        contentClassName="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {primaryMetrics.map((metric, index) => {
          const Icon =
            metric.key === 'visitors'
              ? UsersRound
              : metric.key === 'conversion_rate'
                ? TrendingUp
                : metric.key === 'full_audit_submissions'
                  ? FileCheck2
                  : CalendarCheck;

          return (
            <MetricCard
              key={metric.key}
              metric={metric}
              icon={Icon}
              emphasis={index === 0}
            />
          );
        })}
      </DashboardSection>

      <DashboardSection
        title="Traffic and conversion"
        description="A fast read on whether acquisition volume is translating into lead intent."
        contentClassName="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]"
      >
        <AnalyticsChartCard
          title="Visitors and leads over time"
          description="Daily visitors compared with lead submissions for the selected operating window."
          data={analytics.dailyVisitors}
          secondaryData={analytics.dailySubmissions}
          variant="line"
          insight={conversionInsight}
          emptyDescription="Once traffic and lead events are captured, this chart will show whether acquisition is turning into demand."
        />
        <FunnelCard steps={overview.funnel} />
      </DashboardSection>

      <DashboardSection
        title="Booked intent"
        description="Where visitors show readiness for a sales conversation."
        contentClassName="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
      >
        <AnalyticsChartCard
          title="Schedule clicks"
          description="Booked-intent clicks across audit success and booking paths."
          data={analytics.dailyScheduleClicks}
          variant="bar"
          insight="Use this to separate passive traffic from visitors ready to talk."
          emptyDescription="Once visitors click scheduling paths, this chart will show booked-intent movement by day."
        />
        <NeedsAttention items={overview.needsAttention} />
      </DashboardSection>

      <DashboardSection
        title="Acquisition quality"
        description="Source, page, campaign, and device signals that explain where qualified demand is forming."
      >
        <SourcePerformance
          routes={analytics.topLandingPages}
          ctaSources={analytics.ctaClicksBySource}
          campaigns={analytics.utmCampaignPerformance}
          referrers={analytics.topReferrers}
          devices={overview.deviceCategories}
        />
      </DashboardSection>

      <DashboardSection
        title="Lead quality"
        description="A short operating view of fit, reply risk, and proposal readiness."
        contentClassName="grid gap-4 lg:grid-cols-3"
      >
        {overview.leadQuality.map((item, index) => (
          <InsightCard
            key={item.label}
            title={item.label}
            value={item.value}
            description={item.context}
            icon={index === 0 ? TrendingUp : index === 1 ? MailQuestion : Target}
            tone={index === 0 ? 'warning' : index === 1 ? 'primary' : 'success'}
          />
        ))}
      </DashboardSection>

      <DashboardSection
        title="Newest audit signals"
        description="Recent submissions ordered by intent depth and time for sales review."
      >
        <RecentSubmissions submissions={overview.recentSubmissions} />
      </DashboardSection>
    </>
  );
}
