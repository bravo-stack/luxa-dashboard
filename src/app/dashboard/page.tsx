import { Suspense } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CalendarCheck,
  Eye,
  FileCheck2,
  Plus,
  Target,
  TrendingUp,
  UsersRound,
} from 'lucide-react';

import { AnalyticsChartCard } from '@/components/dashboard/analytics-chart-card';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { FunnelCard } from '@/components/dashboard/funnel-card';
import { MetricRail } from '@/components/dashboard/metric-rail';
import { NeedsAttention } from '@/components/dashboard/needs-attention';
import { PipelineCard } from '@/components/dashboard/pipeline-card';
import { RealtimeStrip } from '@/components/dashboard/realtime-strip';
import { RecentSubmissions } from '@/components/dashboard/recent-submissions';
import { SourcePerformance } from '@/components/dashboard/source-performance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDashboardAnalytics, normalizeAnalyticsFilters } from '@/lib/analytics/server';
import type { DateRangeKey } from '@/lib/analytics/types';
import { getWorkspaceUser } from '@/lib/auth/workspace';
import { getDashboardOverview, getSalesWorkspaceOverview } from '@/lib/dashboard/queries';
import type { MetricSummary } from '@/lib/dashboard/types';

export const dynamic = 'force-dynamic';

type DashboardPageProps = {
  searchParams?: Promise<{
    range?: string;
    project?: string;
    funnel?: string;
  }>;
};

function selectMetrics(metrics: MetricSummary[]) {
  const priority = ['pageviews', 'visitors', 'conversion_rate', 'lead_form_submitted'];

  return priority
    .map((key) => metrics.find((metric) => metric.key === key))
    .filter(Boolean) as MetricSummary[];
}

async function SalesExecutiveDashboard({
  user,
}: {
  user: NonNullable<Awaited<ReturnType<typeof getWorkspaceUser>>>;
}) {
  const overview = await getSalesWorkspaceOverview(user.id);
  const firstName = user.displayName.split(/\s+/)[0] || 'there';
  const actionableCount = overview.needsAttention.reduce(
    (total, item) => total + item.count,
    0,
  );

  return (
    <>
      <DashboardHeader
        eyebrow="My workspace / assigned pipeline"
        title={`Good to see you, ${firstName}`}
        description="A focused view of the opportunities you own, the follow-ups at risk, and the work that moves your pipeline forward."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant="teal">Private workspace</Badge>
            <Badge variant={actionableCount ? 'warm' : 'outline'}>
              {actionableCount
                ? `${actionableCount} ${actionableCount === 1 ? 'item' : 'items'} need attention`
                : 'Follow-ups clear'}
            </Badge>
          </div>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dashboard/leads">
                <Target className="size-4" />
                My lead queue
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/leads/new">
                <Plus className="size-4" />
                Add lead
              </Link>
            </Button>
          </>
        }
      />

      <MetricRail
        metrics={overview.metrics}
        icons={[UsersRound, TrendingUp, CalendarCheck, FileCheck2]}
      />

      <DashboardSection
        eyebrow="Daily operating view"
        title="Where your attention has the most leverage"
        description="Only leads assigned to you are included in this pipeline and follow-up view."
        contentClassName="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]"
      >
        <PipelineCard stages={overview.pipeline} />
        <NeedsAttention items={overview.needsAttention} />
      </DashboardSection>

      <DashboardSection
        eyebrow="Newest intent"
        title="Your latest submissions"
        description="Recent activity from your assigned opportunities, ordered for fast qualification."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/leads">
              <CalendarCheck className="size-4" />
              Open my queue
            </Link>
          </Button>
        }
      >
        <RecentSubmissions submissions={overview.recentSubmissions} />
      </DashboardSection>
    </>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getWorkspaceUser();

  if (!user) return null;
  if (user.role === 'sales_exec') {
    return <SalesExecutiveDashboard user={user} />;
  }

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
  const priorityMetrics = selectMetrics(analytics.metrics);
  const submissions =
    analytics.metrics.find((metric) => metric.key === 'lead_form_submitted')?.value ?? 0;
  const visitorCount =
    analytics.metrics.find((metric) => metric.key === 'visitors')?.value ?? 0;

  return (
    <>
      <DashboardHeader
        eyebrow={`${overview.dateRange.label} / operating view`}
        title="Growth operations cockpit"
        description="A decisive view of demand movement, conversion quality, and the exact lead work that needs attention now."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant="teal">Live analytics</Badge>
            <Badge variant="outline">Live CRM</Badge>
          </div>
        }
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
                Signal room
              </Link>
            </Button>
          </>
        }
      />

      <RealtimeStrip data={analytics.realtime} />

      <MetricRail
        metrics={priorityMetrics}
        icons={[Eye, UsersRound, TrendingUp, FileCheck2]}
      />

      <DashboardSection
        eyebrow="Executive readout"
        title="Is attention becoming demand?"
        description={`${submissions.toLocaleString()} validated submissions from ${visitorCount.toLocaleString()} visitors in this range.`}
        contentClassName="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.55fr)]"
      >
        <AnalyticsChartCard
          title="Demand trajectory"
          description="Native page views layered with validated form submissions."
          data={analytics.dailyPageViews}
          secondaryData={analytics.dailySubmissions}
          secondaryLabel="Submissions"
          variant="line"
          insight="Read the distance between the lines as conversion leverage: traffic without submissions needs a proposition or path diagnosis."
          emptyDescription="This view will populate after native page views and submission events are recorded."
        />
        <FunnelCard steps={analytics.funnel} />
      </DashboardSection>

      <DashboardSection
        eyebrow="Lead operations"
        title="What the team should act on"
        description="Pipeline distribution and follow-up risk from the live CRM."
        contentClassName="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]"
      >
        <PipelineCard stages={overview.pipeline} />
        <NeedsAttention items={overview.needsAttention} />
      </DashboardSection>

      <DashboardSection
        eyebrow="Acquisition quality"
        title="Where demand is concentrating"
        description="A compact matrix of high-attention pages, sources, campaigns, placements, and devices."
      >
        <SourcePerformance
          routes={analytics.topLandingPages}
          ctaSources={analytics.ctaClicksBySource}
          campaigns={analytics.utmCampaignPerformance}
          referrers={analytics.topReferrers}
          devices={analytics.deviceCategories ?? []}
        />
      </DashboardSection>

      <DashboardSection
        eyebrow="Newest intent"
        title="Latest audit signals"
        description="Recent submissions ordered for fast qualification and follow-up."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/leads">
              <CalendarCheck className="size-4" />
              Open lead queue
            </Link>
          </Button>
        }
      >
        <RecentSubmissions submissions={overview.recentSubmissions} />
      </DashboardSection>
    </>
  );
}
