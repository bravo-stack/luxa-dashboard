'use server';

import { revalidatePath } from 'next/cache';

import { recordSecurityEvent, requirePermission } from '@/lib/auth/workspace';
import {
  createMarketingCampaign,
  createMarketingLink,
  getMarketingLinkById,
  setCampaignArchived,
  setLinkArchived,
  updateCampaignName,
  updateLinkName,
} from '@/lib/marketing/repository';
import {
  type CampaignChannel,
  campaignChannelPresets,
  campaignChannels,
  isTrackingValue,
  toTrackingSlug,
} from '@/lib/marketing/tracking';

export type CampaignActionState = {
  message: string;
  success?: boolean;
  campaignId?: string;
  publicCode?: string;
  errors?: Partial<
    Record<
      'name' | 'utmCampaign' | 'channel' | 'source' | 'medium' | 'content' | 'term',
      string
    >
  >;
};

function value(formData: FormData, key: string, maximum: number) {
  return String(formData.get(key) ?? '')
    .replace(/\0/g, '')
    .trim()
    .slice(0, maximum);
}

function isUuid(input: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    input,
  );
}

export async function createCampaignAction(
  _state: CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
  const admin = await requirePermission('campaigns.manage');
  const name = value(formData, 'name', 120);
  const utmCampaign = toTrackingSlug(value(formData, 'utmCampaign', 160));
  const errors: NonNullable<CampaignActionState['errors']> = {};

  if (name.length < 2) errors.name = 'Use a campaign name of at least two characters.';
  if (!isTrackingValue(utmCampaign, 160)) {
    errors.utmCampaign =
      'Use a lowercase campaign slug with letters, numbers, hyphens, or underscores.';
  }
  if (Object.keys(errors).length)
    return { message: 'Review the highlighted fields.', errors };

  try {
    const campaignId = await createMarketingCampaign({
      name,
      utmCampaign,
      createdBy: admin.id,
    });
    await recordSecurityEvent({
      action: 'campaign_created',
      actorUserId: admin.id,
      metadata: { campaign_id: campaignId },
    });
    revalidatePath('/dashboard/campaigns');
    return { message: 'Campaign created.', success: true, campaignId };
  } catch (error) {
    console.error('Campaign creation failed', error);
    return {
      message:
        'That campaign slug may already exist. Choose a distinct slug and try again.',
    };
  }
}

export async function createLinkAction(
  _state: CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
  const admin = await requirePermission('campaigns.manage');
  const campaignId = value(formData, 'campaignId', 40);
  const name = value(formData, 'name', 120);
  const channel = value(formData, 'channel', 40) as CampaignChannel;
  const preset = campaignChannelPresets[channel];
  const source = toTrackingSlug(
    value(formData, 'source', 100) || preset?.source || '',
    100,
  );
  const medium = toTrackingSlug(
    value(formData, 'medium', 100) || preset?.medium || '',
    100,
  );
  const content = toTrackingSlug(value(formData, 'content', 160), 160);
  const term = toTrackingSlug(value(formData, 'term', 160), 160);
  const errors: NonNullable<CampaignActionState['errors']> = {};

  if (!isUuid(campaignId)) return { message: 'Choose a valid campaign.' };
  if (name.length < 2) errors.name = 'Name the channel or placement.';
  if (!campaignChannels.includes(channel)) errors.channel = 'Choose a supported channel.';
  if (!isTrackingValue(source, 100)) errors.source = 'Enter a valid lowercase source.';
  if (!isTrackingValue(medium, 100)) errors.medium = 'Enter a valid lowercase medium.';
  if (content && !isTrackingValue(content, 160))
    errors.content = 'Use a valid creative or placement value.';
  if (term && !isTrackingValue(term, 160)) errors.term = 'Use a valid paid-search term.';
  if (Object.keys(errors).length)
    return { message: 'Review the highlighted fields.', errors };

  try {
    const created = await createMarketingLink({
      campaignId,
      name,
      channel,
      source,
      medium,
      content: content || undefined,
      term: term || undefined,
      createdBy: admin.id,
    });
    await recordSecurityEvent({
      action: 'campaign_link_created',
      actorUserId: admin.id,
      metadata: { campaign_id: campaignId, link_id: created.id },
    });
    revalidatePath('/dashboard/campaigns');
    revalidatePath(`/dashboard/campaigns/${campaignId}`);
    return {
      message: 'Tracked link created and ready to share.',
      success: true,
      publicCode: created.publicCode,
    };
  } catch (error) {
    console.error('Campaign link creation failed', error);
    return { message: 'The tracked link could not be created. Try again.' };
  }
}

export async function renameCampaignAction(formData: FormData) {
  const admin = await requirePermission('campaigns.manage');
  const id = value(formData, 'campaignId', 40);
  const name = value(formData, 'name', 120);
  if (!isUuid(id) || name.length < 2) return;
  await updateCampaignName(id, name);
  await recordSecurityEvent({
    action: 'campaign_updated',
    actorUserId: admin.id,
    metadata: { campaign_id: id },
  });
  revalidatePath('/dashboard/campaigns');
  revalidatePath(`/dashboard/campaigns/${id}`);
}

export async function toggleCampaignArchiveAction(formData: FormData) {
  const admin = await requirePermission('campaigns.manage');
  const id = value(formData, 'campaignId', 40);
  const archived = value(formData, 'archived', 5) === 'true';
  if (!isUuid(id)) return;
  await setCampaignArchived(id, archived);
  await recordSecurityEvent({
    action: 'campaign_archived',
    actorUserId: admin.id,
    metadata: { campaign_id: id, archived },
  });
  revalidatePath('/dashboard/campaigns');
  revalidatePath(`/dashboard/campaigns/${id}`);
}

export async function renameLinkAction(formData: FormData) {
  const admin = await requirePermission('campaigns.manage');
  const id = value(formData, 'linkId', 40);
  const campaignId = value(formData, 'campaignId', 40);
  const name = value(formData, 'name', 120);
  if (!isUuid(id) || !isUuid(campaignId) || name.length < 2) return;
  await updateLinkName(id, name);
  await recordSecurityEvent({
    action: 'campaign_link_updated',
    actorUserId: admin.id,
    metadata: { campaign_id: campaignId, link_id: id },
  });
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
}

export async function toggleLinkArchiveAction(formData: FormData) {
  const admin = await requirePermission('campaigns.manage');
  const id = value(formData, 'linkId', 40);
  const campaignId = value(formData, 'campaignId', 40);
  const archived = value(formData, 'archived', 5) === 'true';
  if (!isUuid(id) || !isUuid(campaignId)) return;
  await setLinkArchived(id, archived);
  await recordSecurityEvent({
    action: 'campaign_link_updated',
    actorUserId: admin.id,
    metadata: { campaign_id: campaignId, link_id: id, archived },
  });
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
}

export async function duplicateLinkAction(formData: FormData) {
  const admin = await requirePermission('campaigns.manage');
  const id = value(formData, 'linkId', 40);
  const campaignId = value(formData, 'campaignId', 40);
  if (!isUuid(id) || !isUuid(campaignId)) return;
  const source = await getMarketingLinkById(id);
  if (!source || source.campaignId !== campaignId) return;
  const created = await createMarketingLink({
    campaignId,
    name: `${source.name} copy`.slice(0, 120),
    channel: source.channel,
    source: source.source,
    medium: source.medium,
    content: source.content,
    term: source.term,
    createdBy: admin.id,
  });
  await recordSecurityEvent({
    action: 'campaign_link_created',
    actorUserId: admin.id,
    metadata: { campaign_id: campaignId, link_id: created.id, duplicated_from: id },
  });
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
}
