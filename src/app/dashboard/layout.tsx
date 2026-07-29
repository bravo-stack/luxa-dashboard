import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getDashboardIdentity, getWorkspaceUser } from '@/lib/auth/workspace';

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
  const user = await getWorkspaceUser();

  if (!user) redirect('/');

  const identity = await getDashboardIdentity(user);

  if (!identity) redirect('/');

  return <DashboardShell identity={identity}>{children}</DashboardShell>;
}
