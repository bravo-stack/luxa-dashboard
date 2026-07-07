import type { Metadata } from 'next';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export const metadata: Metadata = {
  title: 'Dashboard | Luxa',
  description: 'Private Luxa lead operations command center.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardShell>{children}</DashboardShell>;
}
