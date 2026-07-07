import type { ReactNode } from 'react';

import { DashboardSidebar } from './dashboard-sidebar';
import { DashboardTopbar } from './dashboard-topbar';

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="bg-grid-lines pointer-events-none fixed inset-0 opacity-35"
        aria-hidden="true"
      />
      <DashboardSidebar />
      <div className="relative min-h-screen lg:pl-72">
        <DashboardTopbar />
        <main className="mx-auto flex w-full max-w-375 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
