import { Database, ShieldCheck, SlidersHorizontal } from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { InsightCard } from '@/components/dashboard/insight-card';

export default function SettingsPage() {
  return (
    <>
      <DashboardHeader
        eyebrow="Admin settings"
        title="Dashboard preferences"
        description="Connection and account controls are prepared for the Supabase auth layer and PostHog reporting sync."
      />
      <section className="grid gap-4 lg:grid-cols-3">
        <InsightCard
          title="Dashboard preferences"
          value="Ready"
          description="Saved views, default ranges, and table preferences can be wired when admin accounts are active."
          icon={SlidersHorizontal}
          tone="primary"
        />
        <InsightCard
          title="Analytics connection"
          value="Mock"
          description="PostHog reads should flow through server route handlers before charts use live data."
          icon={Database}
          tone="violet"
        />
        <InsightCard
          title="Admin access"
          value="Prepared"
          description="Supabase dashboard auth can guard this route without changing the UI structure."
          icon={ShieldCheck}
          tone="teal"
        />
      </section>
    </>
  );
}
