export const campaignChannels = [
  'linkedin_organic',
  'linkedin_paid',
  'instagram_organic',
  'facebook_organic',
  'meta_paid',
  'google_ads',
  'email',
  'whatsapp',
  'partner',
  'direct_outreach',
  'other',
] as const;

export type CampaignChannel = (typeof campaignChannels)[number];

export const campaignChannelPresets: Record<
  CampaignChannel,
  { label: string; source: string; medium: string; configurableSource?: boolean }
> = {
  linkedin_organic: {
    label: 'LinkedIn organic',
    source: 'linkedin',
    medium: 'organic_social',
  },
  linkedin_paid: { label: 'LinkedIn paid', source: 'linkedin', medium: 'paid_social' },
  instagram_organic: {
    label: 'Instagram organic',
    source: 'instagram',
    medium: 'organic_social',
  },
  facebook_organic: {
    label: 'Facebook organic',
    source: 'facebook',
    medium: 'organic_social',
  },
  meta_paid: { label: 'Meta paid', source: 'meta', medium: 'paid_social' },
  google_ads: { label: 'Google Ads', source: 'google', medium: 'cpc' },
  email: {
    label: 'Email / newsletter',
    source: 'newsletter',
    medium: 'email',
    configurableSource: true,
  },
  whatsapp: { label: 'WhatsApp', source: 'whatsapp', medium: 'direct_message' },
  partner: {
    label: 'Partner / referral',
    source: 'partner',
    medium: 'referral',
    configurableSource: true,
  },
  direct_outreach: {
    label: 'Direct outreach',
    source: 'outreach',
    medium: 'direct_outreach',
    configurableSource: true,
  },
  other: { label: 'Other', source: 'other', medium: 'other', configurableSource: true },
};

export const TRACKING_VALUE_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export function toTrackingSlug(value: string, maxLength = 160) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
}

export function isTrackingValue(value: string, maxLength: number) {
  return (
    value.length > 0 && value.length <= maxLength && TRACKING_VALUE_PATTERN.test(value)
  );
}

export function publicCampaignUrl(publicCode: string) {
  return `https://www.luxasolution.com/go/${publicCode}`;
}
