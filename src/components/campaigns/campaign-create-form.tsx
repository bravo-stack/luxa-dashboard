'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import {
  type CampaignActionState,
  createCampaignAction,
} from '@/app/dashboard/campaigns/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toTrackingSlug } from '@/lib/marketing/tracking';

const initialState: CampaignActionState = { message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {pending ? 'Creating campaign' : 'Create campaign'}
      {!pending ? <ArrowRight aria-hidden /> : null}
    </Button>
  );
}

export function CampaignCreateForm() {
  const router = useRouter();
  const [state, action] = useActionState(createCampaignAction, initialState);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (state.success && state.campaignId)
      router.push(`/dashboard/campaigns/${state.campaignId}`);
  }, [router, state.campaignId, state.success]);

  return (
    <form action={action} className="space-y-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
        <div className="space-y-2">
          <label htmlFor="campaign-name" className="text-sm font-semibold">
            Campaign name
          </label>
          <Input
            id="campaign-name"
            name="name"
            value={name}
            onChange={(event) => {
              const next = event.target.value;
              setName(next);
              if (!slugEdited) setSlug(toTrackingSlug(next));
            }}
            maxLength={120}
            placeholder="Q4 platform audit demand"
            aria-invalid={Boolean(state.errors?.name)}
            required
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Editable later; use the name your team recognizes.
          </p>
          {state.errors?.name ? (
            <p className="text-xs text-destructive">{state.errors.name}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="campaign-slug" className="text-sm font-semibold">
            Tracking slug
          </label>
          <Input
            id="campaign-slug"
            name="utmCampaign"
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(toTrackingSlug(event.target.value));
            }}
            maxLength={160}
            placeholder="q4-platform-audit-demand"
            aria-invalid={Boolean(state.errors?.utmCampaign)}
            required
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Becomes `utm_campaign` and is immutable after creation.
          </p>
          {state.errors?.utmCampaign ? (
            <p className="text-xs text-destructive">{state.errors.utmCampaign}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={state.success ? 'text-sm text-success' : 'text-sm text-destructive'}
          aria-live="polite"
        >
          {state.message}
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
