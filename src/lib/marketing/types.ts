import type { CampaignChannel } from './tracking';

export type AttributionModel = 'first' | 'last';
export type CampaignRange = '7d' | '30d' | '90d' | 'lifetime';

export type MarketingLink = {
  id: string;
  campaignId: string;
  publicCode: string;
  name: string;
  destinationPath: '/audit';
  channel: CampaignChannel;
  source: string;
  medium: string;
  content?: string;
  term?: string;
  createdAt: string;
  archivedAt?: string;
  metrics: CampaignMetrics;
};

export type CampaignMetrics = {
  redirectRequests: number;
  trackedArrivals: number;
  auditStarts: number;
  submittedAudits: number;
  qualified: number;
  won: number;
  lost: number;
  spam: number;
};

export type MarketingCampaign = {
  id: string;
  trackingId: string;
  name: string;
  utmCampaign: string;
  createdAt: string;
  archivedAt?: string;
  links: MarketingLink[];
  metrics: CampaignMetrics;
};

export type CampaignOverview = {
  campaigns: MarketingCampaign[];
  totals: CampaignMetrics & { activeCampaigns: number };
  analyticsAvailable: boolean;
};

export const emptyCampaignMetrics = (): CampaignMetrics => ({
  redirectRequests: 0,
  trackedArrivals: 0,
  auditStarts: 0,
  submittedAudits: 0,
  qualified: 0,
  won: 0,
  lost: 0,
  spam: 0,
});
