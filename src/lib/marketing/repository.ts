import 'server-only';

import { randomBytes } from 'node:crypto';

import { getCampaignLinkSignals } from '@/lib/analytics/umami';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

import type { CampaignChannel } from './tracking';
import type {
  AttributionModel,
  CampaignMetrics,
  CampaignOverview,
  CampaignRange,
  MarketingCampaign,
  MarketingLink,
} from './types';
import { emptyCampaignMetrics } from './types';

type CampaignRow = {
  id: string;
  tracking_id: string;
  name: string;
  utm_campaign: string;
  created_at: string;
  archived_at: string | null;
};

type LinkRow = {
  id: string;
  campaign_id: string;
  public_code: string;
  name: string;
  destination_path: '/audit';
  channel: CampaignChannel;
  utm_source: string;
  utm_medium: string;
  utm_content: string | null;
  utm_term: string | null;
  created_at: string;
  archived_at: string | null;
};

type LeadRow = {
  status: string;
  attribution: Record<string, unknown> | null;
};

function randomCode() {
  return randomBytes(6).toString('hex');
}

function rangeStart(range: CampaignRange, campaignCreatedAt?: string) {
  if (range === 'lifetime') {
    return campaignCreatedAt ? new Date(campaignCreatedAt) : new Date(0);
  }
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1_000);
}

function linkFromRow(row: LinkRow): MarketingLink {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    publicCode: row.public_code,
    name: row.name,
    destinationPath: row.destination_path,
    channel: row.channel,
    source: row.utm_source,
    medium: row.utm_medium,
    content: row.utm_content ?? undefined,
    term: row.utm_term ?? undefined,
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? undefined,
    metrics: emptyCampaignMetrics(),
  };
}

function addMetrics(target: CampaignMetrics, source: CampaignMetrics) {
  for (const key of Object.keys(target) as Array<keyof CampaignMetrics>) {
    target[key] += source[key];
  }
}

export async function getCampaignOverview(
  options: {
    range?: CampaignRange;
    attribution?: AttributionModel;
    campaignId?: string;
  } = {},
): Promise<CampaignOverview> {
  const supabase = getSupabaseAdminClient();
  const range = options.range ?? '30d';
  const attribution = options.attribution ?? 'first';
  const [campaignResult, linkResult] = await Promise.all([
    supabase
      .from('marketing_campaigns')
      .select('id,tracking_id,name,utm_campaign,created_at,archived_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('marketing_links')
      .select(
        'id,campaign_id,public_code,name,destination_path,channel,utm_source,utm_medium,utm_content,utm_term,created_at,archived_at',
      )
      .order('created_at', { ascending: false }),
  ]);

  if (campaignResult.error) throw campaignResult.error;
  if (linkResult.error) throw linkResult.error;

  const campaignRows = (campaignResult.data ?? []) as CampaignRow[];
  const selectedCreatedAt = options.campaignId
    ? campaignRows.find((item) => item.id === options.campaignId)?.created_at
    : undefined;
  const start = rangeStart(range, selectedCreatedAt);
  const end = new Date();

  const [statsResult, leadsResult, analytics] = await Promise.all([
    supabase
      .from('marketing_link_daily_stats')
      .select('marketing_link_id,redirect_requests,stat_date')
      .gte('stat_date', start.toISOString().slice(0, 10))
      .lte('stat_date', end.toISOString().slice(0, 10)),
    supabase
      .from('lead_submissions')
      .select('status,attribution')
      .eq('form_type', 'platform_audit')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString()),
    getCampaignLinkSignals(start.getTime(), end.getTime()),
  ]);

  if (statsResult.error) throw statsResult.error;
  if (leadsResult.error) throw leadsResult.error;

  const links = ((linkResult.data ?? []) as LinkRow[]).map(linkFromRow);
  const requestsByLink = new Map<string, number>();
  for (const row of statsResult.data ?? []) {
    const id = String(row.marketing_link_id);
    requestsByLink.set(id, (requestsByLink.get(id) ?? 0) + Number(row.redirect_requests));
  }

  const leads = (leadsResult.data ?? []) as LeadRow[];
  const attributionKey = `${attribution}_touch_link_id`;

  const campaigns: MarketingCampaign[] = campaignRows.map((row) => {
    const campaignLinks = links
      .filter((link) => link.campaignId === row.id)
      .map((link) => ({ ...link, metrics: emptyCampaignMetrics() }));
    const metrics = emptyCampaignMetrics();

    for (const link of campaignLinks) {
      link.metrics.redirectRequests = requestsByLink.get(link.id) ?? 0;
      link.metrics.trackedArrivals = analytics.arrivalsByLink[link.publicCode] ?? 0;
      link.metrics.auditStarts =
        attribution === 'first'
          ? (analytics.startsByFirstLink[link.publicCode] ?? 0)
          : (analytics.startsByLastLink[link.publicCode] ?? 0);

      for (const lead of leads) {
        if (lead.attribution?.[attributionKey] !== link.publicCode) continue;
        link.metrics.submittedAudits += 1;
        if (lead.status === 'qualified' || lead.status === 'won')
          link.metrics.qualified += 1;
        if (lead.status === 'won') link.metrics.won += 1;
        if (lead.status === 'lost') link.metrics.lost += 1;
        if (lead.status === 'spam') link.metrics.spam += 1;
      }
      addMetrics(metrics, link.metrics);
    }

    return {
      id: row.id,
      trackingId: row.tracking_id,
      name: row.name,
      utmCampaign: row.utm_campaign,
      createdAt: row.created_at,
      archivedAt: row.archived_at ?? undefined,
      links: campaignLinks,
      metrics,
    };
  });

  const totals = { ...emptyCampaignMetrics(), activeCampaigns: 0 };
  for (const campaign of campaigns) {
    if (!campaign.archivedAt) totals.activeCampaigns += 1;
    addMetrics(totals, campaign.metrics);
  }

  return { campaigns, totals, analyticsAvailable: analytics.available };
}

export async function createMarketingCampaign(input: {
  name: string;
  utmCampaign: string;
  createdBy: string;
}) {
  const supabase = getSupabaseAdminClient();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const trackingId = `cmp_${randomCode()}`;
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert({
        tracking_id: trackingId,
        name: input.name,
        utm_campaign: input.utmCampaign,
        created_by: input.createdBy,
      })
      .select('id')
      .single();
    if (!error && data) return String(data.id);
    if (error?.code !== '23505') throw error;
  }
  throw new Error('Unable to allocate a unique campaign identifier.');
}

export async function createMarketingLink(input: {
  campaignId: string;
  name: string;
  channel: CampaignChannel;
  source: string;
  medium: string;
  content?: string;
  term?: string;
  createdBy: string;
}) {
  const supabase = getSupabaseAdminClient();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const publicCode = randomCode();
    const { data, error } = await supabase
      .from('marketing_links')
      .insert({
        campaign_id: input.campaignId,
        public_code: publicCode,
        name: input.name,
        destination_path: '/audit',
        channel: input.channel,
        utm_source: input.source,
        utm_medium: input.medium,
        utm_content: input.content || null,
        utm_term: input.term || null,
        created_by: input.createdBy,
      })
      .select('id,public_code')
      .single();
    if (!error && data)
      return { id: String(data.id), publicCode: String(data.public_code) };
    if (error?.code !== '23505') throw error;
  }
  throw new Error('Unable to allocate a unique campaign link.');
}

export async function updateCampaignName(id: string, name: string) {
  const { error } = await getSupabaseAdminClient()
    .from('marketing_campaigns')
    .update({ name })
    .eq('id', id);
  if (error) throw error;
}

export async function setCampaignArchived(id: string, archived: boolean) {
  const { error } = await getSupabaseAdminClient()
    .from('marketing_campaigns')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw error;
}

export async function updateLinkName(id: string, name: string) {
  const { error } = await getSupabaseAdminClient()
    .from('marketing_links')
    .update({ name })
    .eq('id', id);
  if (error) throw error;
}

export async function setLinkArchived(id: string, archived: boolean) {
  const { error } = await getSupabaseAdminClient()
    .from('marketing_links')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw error;
}

export async function getMarketingLinkById(id: string) {
  const { data, error } = await getSupabaseAdminClient()
    .from('marketing_links')
    .select(
      'id,campaign_id,public_code,name,destination_path,channel,utm_source,utm_medium,utm_content,utm_term,created_at,archived_at',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? linkFromRow(data as LinkRow) : null;
}
