import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { CreateLeadForm } from '@/components/leads/create-lead-form';
import { Button } from '@/components/ui/button';

export default function NewLeadPage() {
  return (
    <>
      <DashboardHeader
        eyebrow="Lead operations"
        title="Create a CRM lead"
        description="Add a relationship that arrived outside the Luxa funnel and preserve the context your team needs to act."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/leads">
              <ArrowLeft className="size-4" />
              Back to leads
            </Link>
          </Button>
        }
      />
      <CreateLeadForm />
    </>
  );
}
