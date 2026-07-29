import { Suspense } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Clock3,
  Eye,
  Gauge,
  MousePointerClick,
  Send,
  TrendingUp,
  UsersRound,
} from 'lucide-react';

import { ActivityHeatmap } from '@/components/dashboard/activity-heatmap';
import { AnalyticsChartCard } from '@/components/dashboard/analytics-chart-card';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { FunnelCard } from '@/components/dashboard/funnel-card';
import { MetricRail } from '@/components/dashboard/metric-rail';
import { PageQualityTable } from '@/components/dashboard/page-quality-table';
import { RealtimeStrip } from '@/components/dashboard/realtime-strip';
import { SourcePerformance } from '@/components/dashboard/source-performance';
import { WebVitalsPanel } from '@/components/dashboard/web-vitals-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDashboardAnalytics, normalizeAnalyticsFilters } from '@/lib/analytics/server';
import type { DateRangeKey } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';

const metricIcons = [
  Eye,
  UsersRound,
  Activity,
  TrendingUp,
  Gauge,
  Clock3,
  Send,
  MousePointerClick,
];

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
  const analytics = await getDashboardAnalytics(filters);
  const signalCount = analytics.availability.available.length;
  const totalSignals = signalCount + analytics.availability.unavailable.length;

  return (
    <>
      <DashboardHeader
        eyebrow="Growth intelligence / live"
        title="Demand signal room"
        description="A privacy-safe view of reach, attention quality, acquisition, ordered conversion, and the experience conditions behind demand."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="teal">
              <span className="mr-1.5 size-1.5 rounded-full bg-success" />
              Umami live
            </Badge>
            <Badge variant="outline">
              {signalCount}/{totalSignals} signal groups online
            </Badge>
            {analytics.availability.unavailable.length ? (
              <Badge variant="warm">
                {analytics.availability.unavailable.length} gracefully unavailable
              </Badge>
            ) : null}
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
            <Button asChild variant="secondary">
              <Link href="/dashboard">
                <ArrowLeft className="size-4" />
                Overview
              </Link>
            </Button>
          </>
        }
      />

      <RealtimeStrip data={analytics.realtime} />

      <MetricRail metrics={analytics.metrics} icons={metricIcons} />

      <DashboardSection
        eyebrow="Demand movement"
        title="Reach and attention over time"
        description="Native page views and unique visitors, aligned by day and compared with the previous range."
      >
        <AnalyticsChartCard
          title="Traffic trajectory"
          description="Page-view volume with visitor reach layered on the same timeline."
          data={analytics.dailyPageViews}
          secondaryData={analytics.dailyVisitors}
          secondaryLabel="Visitors"
          variant="line"
          insight="A widening gap between views and visitors usually means deeper exploration or repeat attention."
          emptyDescription="Traffic movement will appear after Umami records native sessions."
        />
      </DashboardSection>

      <DashboardSection
        eyebrow="Conversion mechanics"
        title="How attention turns into intent"
        description="An ordered visitor funnel beside the hours when sessions concentrate."
        contentClassName="grid gap-6 xl:grid-cols-[minmax(340px,0.72fr)_minmax(0,1.28fr)]"
      >
        <FunnelCard steps={analytics.funnel} />
        <ActivityHeatmap data={analytics.weeklyActivity} />
      </DashboardSection>

      <PageQualityTable pages={analytics.pageQuality} />

      <DashboardSection
        eyebrow="Acquisition"
        title="Where qualified attention forms"
        description="Native route and referrer data combined with first-click attribution and controlled conversion placements."
      >
        <SourcePerformance
          routes={analytics.topLandingPages}
          referrers={analytics.topReferrers}
          campaigns={analytics.utmCampaignPerformance}
          ctaSources={analytics.ctaClicksBySource}
          devices={analytics.deviceCategories ?? []}
        />
      </DashboardSection>

      <DashboardSection
        eyebrow="Behavior and experience"
        title="What visitors do—and what the interface costs them"
        description="Controlled product events paired with real-user Core Web Vitals."
        contentClassName="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]"
      >
        <AnalyticsChartCard
          title="Behavioral event mix"
          description="Every controlled action observed in the selected range."
          data={analytics.eventVolume ?? []}
          variant="bar"
          emptyDescription="Controlled interaction events will appear as visitors use the site."
        />
        <WebVitalsPanel vitals={analytics.webVitals} />
      </DashboardSection>

      <DashboardSection
        eyebrow="Conversion diagnostics"
        title="Form and intent detail"
        description="Completion volume, submitted industry context, and daily scheduling intent."
        contentClassName="grid gap-6 xl:grid-cols-3"
      >
        <AnalyticsChartCard
          title="Submissions by form"
          description="Quick-start and platform-audit completions."
          data={analytics.formPerformance ?? []}
          variant="bar"
        />
        <AnalyticsChartCard
          title="Submitted industries"
          description="Controlled industry values attached to successful submissions."
          data={analytics.industryPerformance ?? []}
          variant="bar"
        />
        <AnalyticsChartCard
          title="Book-call intent"
          description="Daily clicks into scheduling paths."
          data={analytics.dailyScheduleClicks}
          variant="bar"
        />
      </DashboardSection>

      <DashboardSection
        eyebrow="Audience composition"
        title="Market and technology context"
        description="Channel, country, source, language, and browser distributions without personal profiles."
      >
        <SourcePerformance
          title="Audience composition matrix"
          description="A compact operating view of who is arriving, through which channel, and in what technical context."
          routes={analytics.countries}
          referrers={analytics.channels}
          campaigns={analytics.utmSources}
          ctaSources={analytics.languages}
          devices={analytics.browsers}
          labels={['Countries', 'Channels', 'UTM sources', 'Languages', 'Browsers']}
        />
      </DashboardSection>

      <DashboardSection
        eyebrow="Journey context"
        title="How sessions enter, leave, and render"
        description="Entry and exit concentration beside the locations and screen classes shaping the experience."
      >
        <SourcePerformance
          title="Session context matrix"
          description="Useful for finding weak landing paths, premature exits, and experience patterns tied to market or viewport."
          routes={analytics.entryPages}
          referrers={analytics.exitPages}
          campaigns={analytics.regions}
          ctaSources={analytics.cities}
          devices={analytics.screens}
          labels={['Entry pages', 'Exit pages', 'Regions', 'Cities', 'Screens']}
        />
      </DashboardSection>
    </>
  );
}
