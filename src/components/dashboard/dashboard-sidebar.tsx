'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  ExternalLink,
  Home,
  LayoutDashboard,
  Menu,
  Settings2,
  UsersRound,
  Workflow,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const primaryNav = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/dashboard/leads', icon: UsersRound },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings2 },
];

const publicSiteUrl = 'https://luxa-funnel.vercel.app';

const secondaryNav = [
  { label: 'Funnel', href: `${publicSiteUrl}/audit`, icon: Workflow },
  {
    label: 'Selected Work',
    href: `${publicSiteUrl}/case-studies`,
    icon: BriefcaseBusiness,
  },
  { label: 'Book Call', href: `${publicSiteUrl}/book-call`, icon: CalendarClock },
  { label: 'Public Site', href: publicSiteUrl, icon: Home },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-5 pb-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-sidebar-accent"
        >
          <span className="grid size-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            L
          </span>
          <span className="grid min-w-0">
            <span className="text-sm font-semibold tracking-[-0.01em] text-sidebar-foreground">
              Luxa
            </span>
            <span className="text-[0.6875rem] text-sidebar-foreground/55">
              Operations
            </span>
          </span>
        </Link>
      </div>
      <nav
        className="flex-1 space-y-6 overflow-y-auto px-3 py-3"
        aria-label="Dashboard navigation"
      >
        <div>
          <p className="px-2 text-[0.625rem] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
            Workspace
          </p>
          <div className="mt-2 space-y-1">
            {primaryNav.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-2.5 py-2 text-[0.8125rem] font-medium text-sidebar-foreground/68 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <p className="px-2 text-[0.625rem] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
            Quick links
          </p>
          <div className="mt-2 space-y-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={onNavigate}
                  className="flex items-center justify-between rounded-md px-2.5 py-2 text-[0.8125rem] font-medium text-sidebar-foreground/62 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </span>
                  <ExternalLink className="size-3.5 opacity-45" aria-hidden="true" />
                </a>
              );
            })}
          </div>
        </div>
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 px-1">
          <span className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            LA
          </span>
          <span className="grid min-w-0 flex-1">
            <span className="truncate text-xs font-semibold text-sidebar-foreground">
              Luxa Admin
            </span>
            <span className="truncate text-[0.6875rem] text-sidebar-foreground/50">
              Admin workspace
            </span>
          </span>
          <span className="size-2 rounded-full bg-success" aria-label="Online" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-3 left-4 z-40 lg:hidden"
            aria-label="Open dashboard navigation"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent className="p-0">
          <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate Luxa dashboard sections.
          </SheetDescription>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
