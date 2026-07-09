import Link from 'next/link';
import {
  BarChart3,
  CalendarCheck,
  Download,
  FileCheck2,
  MailQuestion,
  MousePointerClick,
  Target,
  TrendingUp,
  UserPlus,
  UsersRound,
} from 'lucide-react';

import { AnalyticsChartCard } from '@/components/dashboard/analytics-chart-card';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { FunnelCard } from '@/components/dashboard/funnel-card';
import { InsightCard } from '@/components/dashboard/insight-card';
import { MetricCard } from '@/components/dashboard/metric-card';
import { NeedsAttention } from '@/components/dashboard/needs-attention';
import { RecentSubmissions } from '@/components/dashboard/recent-submissions';
import { SourcePerformance } from '@/components/dashboard/source-performance';
import { Button } from '@/components/ui/button';
import { getTrafficSummary, normalizeAnalyticsFilters } from '@/lib/analytics/server';
import type { DateRangeKey } from '@/lib/analytics/types';
import { getDashboardOverview } from '@/lib/dashboard/queries';

export const dynamic = 'force-dynamic';

const metricIcons = [
  UserPlus,
  UsersRound,
  CalendarCheck,
  MailQuestion,
  FileCheck2,
  MousePointerClick,
];

type DashboardPageProps = {
  searchParams?: Promise<{
    range?: string;
    project?: string;
    funnel?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const filters = normalizeAnalyticsFilters({
    dateRange: params?.range as DateRangeKey,
    project: params?.project,
    funnel: params?.funnel,
  });
  const [overview, traffic] = await Promise.all([
    getDashboardOverview(filters.dateRange),
    getTrafficSummary(filters),
  ]);

  return (
    <>
      <DashboardHeader
        title="Command center"
        description="Monitor inbound demand, lead quality, source performance, and sales follow-up from one restrained operating surface."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/dashboard/analytics">
                <BarChart3 className="size-4" />
                View analytics
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
        aria-label="Dashboard metrics"
      >
        {overview.metrics.map((metric, index) => {
          const Icon = metricIcons[index] ?? TrendingUp;

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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
        <AnalyticsChartCard
          title="Traffic and conversion trend"
          description="Daily visitors and lead submissions for the selected operating window."
          data={traffic.dailyVisitors}
          secondaryData={traffic.dailySubmissions}
          variant="line"
        />
        <FunnelCard steps={overview.funnel} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        <AnalyticsChartCard
          title="Booked-intent movement"
          description="Schedule clicks by day, captured without private lead details."
          data={traffic.dailyScheduleClicks}
          variant="bar"
        />
        <NeedsAttention items={overview.needsAttention} />
      </div>

      <RecentSubmissions submissions={overview.recentSubmissions} />

      <SourcePerformance
        routes={overview.topRoutes}
        ctaSources={overview.topCtaSources}
        campaigns={overview.topUtmCampaigns}
        referrers={overview.topReferrers}
        devices={overview.deviceCategories}
      />

      <section className="grid gap-4 lg:grid-cols-3" aria-label="Lead quality preview">
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
      </section>
    </>
  );
}
