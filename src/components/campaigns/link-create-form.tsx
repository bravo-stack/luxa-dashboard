'use client';

import { useActionState, useState } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import {
  type CampaignActionState,
  createLinkAction,
} from '@/app/dashboard/campaigns/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  type CampaignChannel,
  campaignChannelPresets,
  campaignChannels,
} from '@/lib/marketing/tracking';

const initialState: CampaignActionState = { message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
      {pending ? 'Creating link' : 'Create tracked link'}
    </Button>
  );
}

export function LinkCreateForm({ campaignId }: { campaignId: string }) {
  const [state, action] = useActionState(createLinkAction, initialState);
  const [channel, setChannel] = useState<CampaignChannel>('linkedin_organic');
  const [source, setSource] = useState(campaignChannelPresets.linkedin_organic.source);
  const [medium, setMedium] = useState(campaignChannelPresets.linkedin_organic.medium);

  function changeChannel(next: CampaignChannel) {
    const preset = campaignChannelPresets[next];
    setChannel(next);
    setSource(preset.source);
    setMedium(preset.medium);
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="campaignId" value={campaignId} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="link-name" className="text-xs font-semibold">
            Link name
          </label>
          <Input
            id="link-name"
            name="name"
            maxLength={120}
            placeholder="Founder post · primary CTA"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="link-channel" className="text-xs font-semibold">
            Channel preset
          </label>
          <select
            id="link-channel"
            name="channel"
            value={channel}
            onChange={(event) => changeChannel(event.target.value as CampaignChannel)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {campaignChannels.map((item) => (
              <option key={item} value={item}>
                {campaignChannelPresets[item].label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="link-source" className="text-xs font-semibold">
            Source
          </label>
          <Input
            id="link-source"
            name="source"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            maxLength={100}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="link-medium" className="text-xs font-semibold">
            Medium
          </label>
          <Input
            id="link-medium"
            name="medium"
            value={medium}
            onChange={(event) => setMedium(event.target.value)}
            maxLength={100}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="link-content" className="text-xs font-semibold">
            Creative / placement{' '}
            <span className="font-normal text-muted-foreground">optional</span>
          </label>
          <Input
            id="link-content"
            name="content"
            maxLength={160}
            placeholder="founder-post-primary"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="link-term" className="text-xs font-semibold">
            Paid-search term{' '}
            <span className="font-normal text-muted-foreground">optional</span>
          </label>
          <Input
            id="link-term"
            name="term"
            maxLength={160}
            placeholder="custom-lms-development"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5 text-sm" aria-live="polite">
          {state.success ? (
            <span className="flex items-center gap-2 text-success">
              <Check className="size-4" aria-hidden />
              {state.message}
            </span>
          ) : (
            <span className="text-destructive">{state.message}</span>
          )}
        </div>
        <SubmitButton />
      </div>
    </form>
  );
}
