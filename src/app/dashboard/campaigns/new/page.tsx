import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { CampaignCreateForm } from '@/components/campaigns/campaign-create-form';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { getAdminUser } from '@/lib/auth/admin';

export default async function NewCampaignPage() {
  if (!(await getAdminUser())) redirect('/dashboard');
  return (
    <>
      <DashboardHeader
        eyebrow="Campaign links / create"
        title="Name the demand initiative"
        description="The campaign groups channel links under one immutable reporting key. You can rename the display label later without fragmenting history."
        actions={
          <Button asChild variant="secondary">
            <Link href="/dashboard/campaigns">
              <ArrowLeft aria-hidden />
              Campaigns
            </Link>
          </Button>
        }
      />
      <section className="rounded-xl border border-border bg-card p-5 sm:p-7">
        <CampaignCreateForm />
      </section>
    </>
  );
}
