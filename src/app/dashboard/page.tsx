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

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { FunnelCard } from '@/components/dashboard/funnel-card';
import { InsightCard } from '@/components/dashboard/insight-card';
import { MetricCard } from '@/components/dashboard/metric-card';
import { NeedsAttention } from '@/components/dashboard/needs-attention';
import { PipelineCard } from '@/components/dashboard/pipeline-card';
import { RecentSubmissions } from '@/components/dashboard/recent-submissions';
import { SourcePerformance } from '@/components/dashboard/source-performance';
import { Button } from '@/components/ui/button';
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

export default async function DashboardPage() {
  const overview = await getDashboardOverview();

  return (
    <>
      <DashboardHeader
        eyebrow="Luxa operations"
        title="Command center"
        description="Control the inbound funnel, audit review queue, sales pipeline, and next actions from one calm operational surface."
        actions={
          <>
            <DateRangePicker defaultValue={overview.dateRange.key} />
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        <PipelineCard stages={overview.pipeline} />
        <FunnelCard steps={overview.funnel} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
        <RecentSubmissions submissions={overview.recentSubmissions} />
        <NeedsAttention items={overview.needsAttention} />
      </div>

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
