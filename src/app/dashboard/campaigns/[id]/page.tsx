import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Archive, ArrowLeft, CopyPlus, RotateCcw } from 'lucide-react';

import {
  duplicateLinkAction,
  renameCampaignAction,
  renameLinkAction,
  toggleCampaignArchiveAction,
  toggleLinkArchiveAction,
} from '@/app/dashboard/campaigns/actions';
import { CampaignMetricsStrip } from '@/components/campaigns/campaign-metrics';
import { CopyLinkButton } from '@/components/campaigns/copy-link-button';
import { LinkCreateForm } from '@/components/campaigns/link-create-form';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAdminUser } from '@/lib/auth/admin';
import { getCampaignOverview } from '@/lib/marketing/repository';
import { publicCampaignUrl } from '@/lib/marketing/tracking';
import type { AttributionModel, CampaignRange } from '@/lib/marketing/types';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ range?: string; attribution?: string }>;
};

const formatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' });

export default async function CampaignDetailPage({ params, searchParams }: PageProps) {
  if (!(await getAdminUser())) redirect('/dashboard');
  const { id } = await params;
  const query = await searchParams;
  const range: CampaignRange = ['7d', '30d', '90d', 'lifetime'].includes(
    query?.range ?? '',
  )
    ? (query?.range as CampaignRange)
    : '30d';
  const attribution: AttributionModel = query?.attribution === 'last' ? 'last' : 'first';
  const overview = await getCampaignOverview({ range, attribution, campaignId: id });
  const campaign = overview.campaigns.find((item) => item.id === id);
  if (!campaign) notFound();

  return (
    <>
      <DashboardHeader
        eyebrow="Campaign links / performance"
        title={campaign.name}
        description={`utm_campaign=${campaign.utmCampaign} · created ${formatter.format(new Date(campaign.createdAt))}`}
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant={campaign.archivedAt ? 'outline' : 'teal'}>
              {campaign.archivedAt ? 'Archived · links remain live' : 'Active'}
            </Badge>
            <Badge variant={overview.analyticsAvailable ? 'default' : 'warm'}>
              {overview.analyticsAvailable
                ? 'Umami connected'
                : 'Arrival signals unavailable'}
            </Badge>
          </div>
        }
        actions={
          <Button asChild variant="secondary">
            <Link href="/dashboard/campaigns">
              <ArrowLeft aria-hidden />
              Campaigns
            </Link>
          </Button>
        }
      />

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
      >
        <label className="grid gap-1.5 text-xs font-semibold">
          Date range
          <select
            name="range"
            defaultValue={range}
            className="h-10 min-w-36 rounded-md border border-input bg-background px-3 text-sm font-normal"
          >
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
            <option value="lifetime">Campaign lifetime</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-semibold">
          Lead attribution
          <select
            name="attribution"
            defaultValue={attribution}
            className="h-10 min-w-40 rounded-md border border-input bg-background px-3 text-sm font-normal"
          >
            <option value="first">First touch</option>
            <option value="last">Last touch</option>
          </select>
        </label>
        <Button type="submit" variant="secondary">
          Update view
        </Button>
        <p className="basis-full text-xs leading-5 text-muted-foreground sm:ml-auto sm:max-w-sm sm:basis-auto">
          Redirect requests can include bots and link-preview scanners. They are not
          unique people.
        </p>
      </form>

      <CampaignMetricsStrip metrics={campaign.metrics} />

      <DashboardSection
        eyebrow="Distribution"
        title="Channel links"
        description="Create a distinct link for every channel or creative. Published tracking fields never change."
      >
        {campaign.links.length ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="divide-y divide-border">
              {campaign.links.map((link) => {
                const url = publicCampaignUrl(link.publicCode);
                return (
                  <article
                    key={link.id}
                    className="grid gap-5 p-5 xl:grid-cols-[minmax(260px,1fr)_minmax(360px,1.25fr)_auto] xl:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{link.name}</h3>
                        {link.archivedAt ? (
                          <Badge variant="outline">Archived</Badge>
                        ) : (
                          <Badge variant="secondary">
                            {link.channel.replaceAll('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 truncate text-xs text-muted-foreground">{url}</p>
                      <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                        {link.source} / {link.medium}
                        {link.content ? ` / ${link.content}` : ''}
                      </p>
                    </div>
                    <dl className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                      {[
                        ['Requests', link.metrics.redirectRequests],
                        ['Arrivals', link.metrics.trackedArrivals],
                        ['Starts', link.metrics.auditStarts],
                        ['Submitted', link.metrics.submittedAudits],
                        ['Qualified+', link.metrics.qualified],
                        ['Won', link.metrics.won],
                      ].map(([label, value]) => (
                        <div key={String(label)}>
                          <dt className="text-[0.625rem] tracking-[0.06em] text-muted-foreground uppercase">
                            {label}
                          </dt>
                          <dd className="mt-1 text-sm font-semibold tabular-nums">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <CopyLinkButton value={url} />
                      <form action={duplicateLinkAction}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          <CopyPlus aria-hidden />
                          Duplicate
                        </Button>
                      </form>
                      <form action={toggleLinkArchiveAction}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <input
                          type="hidden"
                          name="archived"
                          value={link.archivedAt ? 'false' : 'true'}
                        />
                        <Button type="submit" variant="ghost" size="sm">
                          {link.archivedAt ? (
                            <RotateCcw aria-hidden />
                          ) : (
                            <Archive aria-hidden />
                          )}
                          {link.archivedAt ? 'Restore' : 'Archive'}
                        </Button>
                      </form>
                    </div>
                    <form action={renameLinkAction} className="flex gap-2 xl:col-span-3">
                      <input type="hidden" name="linkId" value={link.id} />
                      <input type="hidden" name="campaignId" value={campaign.id} />
                      <Input
                        name="name"
                        defaultValue={link.name}
                        maxLength={120}
                        aria-label={`Rename ${link.name}`}
                        className="max-w-sm"
                      />
                      <Button type="submit" variant="ghost" size="sm">
                        Save name
                      </Button>
                    </form>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/15 p-8 text-center">
            <h3 className="font-semibold">No channel links yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with the exact placement you plan to publish first.
            </p>
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        eyebrow="Create"
        title="Add a channel link"
        description="The source and medium start from a controlled preset; change the source only when the partner, newsletter, or outreach channel requires it."
      >
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <LinkCreateForm campaignId={campaign.id} />
        </div>
      </DashboardSection>

      <DashboardSection
        eyebrow="Governance"
        title="Campaign controls"
        description="Display names are editable. Tracking keys remain immutable so historical reporting keeps one meaning."
      >
        <div className="grid gap-5 rounded-xl border border-border bg-card p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <form
            action={renameCampaignAction}
            className="grid max-w-xl gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
          >
            <input type="hidden" name="campaignId" value={campaign.id} />
            <label className="grid gap-1.5 text-xs font-semibold">
              Campaign display name
              <Input name="name" defaultValue={campaign.name} maxLength={120} />
            </label>
            <Button type="submit" variant="secondary">
              Save name
            </Button>
          </form>
          <form action={toggleCampaignArchiveAction}>
            <input type="hidden" name="campaignId" value={campaign.id} />
            <input
              type="hidden"
              name="archived"
              value={campaign.archivedAt ? 'false' : 'true'}
            />
            <Button type="submit" variant="ghost">
              {campaign.archivedAt ? <RotateCcw aria-hidden /> : <Archive aria-hidden />}
              {campaign.archivedAt ? 'Restore campaign' : 'Archive campaign'}
            </Button>
          </form>
        </div>
      </DashboardSection>
    </>
  );
}
