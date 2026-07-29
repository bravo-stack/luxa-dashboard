import type { ReactNode } from 'react';

import type { DashboardIdentity } from '@/lib/auth/types';

import { DashboardSidebar } from './dashboard-sidebar';
import { DashboardTopbar } from './dashboard-topbar';

type DashboardShellProps = {
  children: ReactNode;
  identity: DashboardIdentity;
};

export function DashboardShell({ children, identity }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardSidebar identity={identity} />
      <div className="relative min-h-screen lg:pl-64">
        <DashboardTopbar identity={identity} />
        <main className="mx-auto flex w-full max-w-375 flex-col gap-10 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
