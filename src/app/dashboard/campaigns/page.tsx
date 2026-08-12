import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Archive, ArrowRight, Plus, Search } from 'lucide-react';

import { CampaignMetricsStrip } from '@/components/campaigns/campaign-metrics';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAdminUser } from '@/lib/auth/admin';
import { getCampaignOverview } from '@/lib/marketing/repository';
import type { CampaignRange } from '@/lib/marketing/types';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<{ q?: string; status?: string; range?: string; page?: string }>;
};

const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' });

export default async function CampaignsPage({ searchParams }: PageProps) {
  if (!(await getAdminUser())) redirect('/dashboard');
  const params = await searchParams;
  const range: CampaignRange = ['7d', '30d', '90d'].includes(params?.range ?? '')
    ? (params?.range as CampaignRange)
    : '30d';
  const overview = await getCampaignOverview({ range });
  const query = (params?.q ?? '').trim().toLowerCase();
  const status = ['active', 'archived', 'all'].includes(params?.status ?? '')
    ? params?.status
    : 'active';
  const filtered = overview.campaigns.filter((campaign) => {
    const matchesQuery =
      !query ||
      campaign.name.toLowerCase().includes(query) ||
      campaign.utmCampaign.toLowerCase().includes(query);
    const matchesStatus =
      status === 'all' ||
      (status === 'archived' ? Boolean(campaign.archivedAt) : !campaign.archivedAt);
    return matchesQuery && matchesStatus;
  });
  const page = Math.max(1, Number(params?.page) || 1);
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <DashboardHeader
        eyebrow="Growth operations"
        title="Campaign links"
        description="Create one durable audit link per channel or creative, then follow demand from the redirect through CRM outcome."
        meta={
          <Badge variant={overview.analyticsAvailable ? 'teal' : 'warm'}>
            {overview.analyticsAvailable
              ? 'Umami signals online'
              : 'Supabase signals only'}
          </Badge>
        }
        actions={
          <Button asChild>
            <Link href="/dashboard/campaigns/new">
              <Plus aria-hidden />
              New campaign
            </Link>
          </Button>
        }
      />

      <CampaignMetricsStrip
        metrics={overview.totals}
        activeCampaigns={overview.totals.activeCampaigns}
      />

      <section className="space-y-4" aria-labelledby="campaign-library-heading">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
              Library
            </p>
            <h2
              id="campaign-library-heading"
              className="mt-2 text-xl font-semibold tracking-[-0.025em]"
            >
              Published tracking
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A shared operational record of where every audit link is used.
            </p>
          </div>
          <form
            className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_140px_120px_auto]"
            method="get"
          >
            <label className="relative">
              <Search
                className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground"
                aria-hidden
              />
              <Input
                name="q"
                defaultValue={params?.q}
                placeholder="Search campaigns"
                className="pl-9"
                aria-label="Search campaigns"
              />
            </label>
            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All statuses</option>
            </select>
            <select
              name="range"
              defaultValue={range}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
            </select>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        </div>

        {visible.length ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-border bg-muted/35 text-[0.65rem] tracking-[0.08em] text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-3">Campaign</th>
                    <th className="px-4 py-3">Source mix</th>
                    <th className="px-4 py-3 text-right">Requests</th>
                    <th className="px-4 py-3 text-right">Arrivals</th>
                    <th className="px-4 py-3 text-right">Submitted</th>
                    <th className="px-4 py-3 text-right">Qualified+</th>
                    <th className="px-4 py-3 text-right">Won</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((campaign) => (
                    <tr key={campaign.id} className="transition-colors hover:bg-muted/25">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1.5 size-2 rounded-full ${campaign.archivedAt ? 'bg-muted-foreground/35' : 'bg-success'}`}
                          />
                          <div>
                            <Link
                              href={`/dashboard/campaigns/${campaign.id}`}
                              className="font-semibold hover:text-primary"
                            >
                              {campaign.name}
                            </Link>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {campaign.utmCampaign} · {campaign.links.length} links ·{' '}
                              {date.format(new Date(campaign.createdAt))}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {[...new Set(campaign.links.map((link) => link.source))]
                          .slice(0, 3)
                          .join(', ') || 'No links yet'}
                      </td>
                      {(
                        [
                          'redirectRequests',
                          'trackedArrivals',
                          'submittedAudits',
                          'qualified',
                          'won',
                        ] as const
                      ).map((key) => (
                        <td
                          key={key}
                          className="px-4 py-4 text-right font-semibold tabular-nums"
                        >
                          {campaign.metrics[key].toLocaleString()}
                        </td>
                      ))}
                      <td className="px-5 py-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/campaigns/${campaign.id}`}>
                            Open
                            <ArrowRight aria-hidden />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-border md:hidden">
              {visible.map((campaign) => (
                <article key={campaign.id} className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/dashboard/campaigns/${campaign.id}`}
                        className="font-semibold"
                      >
                        {campaign.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {campaign.utmCampaign}
                      </p>
                    </div>
                    {campaign.archivedAt ? (
                      <Badge variant="outline">Archived</Badge>
                    ) : (
                      <Badge variant="teal">Active</Badge>
                    )}
                  </div>
                  <dl className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Requests</dt>
                      <dd className="mt-1 font-semibold">
                        {campaign.metrics.redirectRequests}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Arrivals</dt>
                      <dd className="mt-1 font-semibold">
                        {campaign.metrics.trackedArrivals}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Submitted</dt>
                      <dd className="mt-1 font-semibold">
                        {campaign.metrics.submittedAudits}
                      </dd>
                    </div>
                  </dl>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={`/dashboard/campaigns/${campaign.id}`}>
                      Open campaign
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-border bg-muted/15 px-6 text-center">
            <div className="max-w-md">
              <Archive className="mx-auto size-8 text-muted-foreground" aria-hidden />
              <h3 className="mt-4 font-semibold">No matching campaign links</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Create a campaign, then issue a separate link for each channel or
                creative. Reusing one link across channels obscures attribution.
              </p>
              <Button asChild className="mt-5">
                <Link href="/dashboard/campaigns/new">Create the first campaign</Link>
              </Button>
            </div>
          </div>
        )}

        {pageCount > 1 ? (
          <nav
            className="flex items-center justify-end gap-2"
            aria-label="Campaign pages"
          >
            <span className="text-xs text-muted-foreground">
              Page {page} of {pageCount}
            </span>
            {page > 1 ? (
              <Button asChild variant="secondary" size="sm">
                <Link
                  href={`?q=${encodeURIComponent(params?.q ?? '')}&status=${status}&range=${range}&page=${page - 1}`}
                >
                  Previous
                </Link>
              </Button>
            ) : null}
            {page < pageCount ? (
              <Button asChild variant="secondary" size="sm">
                <Link
                  href={`?q=${encodeURIComponent(params?.q ?? '')}&status=${status}&range=${range}&page=${page + 1}`}
                >
                  Next
                </Link>
              </Button>
            ) : null}
          </nav>
        ) : null}
      </section>
    </>
  );
}
