import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getAdminUser } from '@/lib/auth/admin';

export const metadata: Metadata = {
  title: 'Dashboard | Luxa',
  description: 'Private Luxa lead operations command center.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!(await getAdminUser())) {
    redirect('/');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
