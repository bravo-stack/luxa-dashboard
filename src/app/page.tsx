import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Activity, ArrowUpRight, ShieldCheck } from 'lucide-react';

import { LoginForm } from '@/components/auth/login-form';
import { getAdminUser } from '@/lib/auth/admin';

export const metadata: Metadata = {
  title: 'Login | Luxa',
  description: 'Sign in to the private Luxa command center.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Home() {
  if (await getAdminUser()) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="grid min-h-screen lg:grid-cols-[minmax(0,1.12fr)_minmax(28rem,0.88fr)]">
        <div className="relative hidden overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute top-[18%] right-0 left-0 border-t border-sidebar-border" />
            <div className="absolute top-[18%] bottom-0 left-[18%] border-l border-sidebar-border" />
            <div className="absolute top-[52%] right-[12%] left-[18%] border-t border-sidebar-border" />
            <div className="absolute top-[calc(52%-0.3rem)] left-[calc(18%-0.3rem)] size-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
          </div>

          <header className="relative flex items-center justify-between px-10 py-8 xl:px-14">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                L
              </span>
              <div>
                <p className="text-sm font-semibold tracking-[-0.01em]">Luxa</p>
                <p className="text-[0.6875rem] text-sidebar-foreground/50">
                  Internal operations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[0.6875rem] font-medium text-sidebar-foreground/55">
              <span className="size-1.5 rounded-full bg-success" />
              Systems operational
            </div>
          </header>

          <div className="relative flex flex-1 items-end px-10 pb-12 xl:px-14 xl:pb-16">
            <div className="max-w-2xl">
              <p className="mb-5 flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.16em] text-primary uppercase">
                <Activity className="size-3.5" aria-hidden="true" />
                One clear operating picture
              </p>
              <h1 className="max-w-xl text-[clamp(3rem,5.5vw,5.75rem)] leading-[0.94] font-semibold tracking-[-0.06em] text-balance">
                Work at the speed of signal.
              </h1>
              <div className="mt-9 flex max-w-xl items-end justify-between gap-10 border-t border-sidebar-border pt-5">
                <p className="max-w-sm text-sm leading-6 text-sidebar-foreground/58">
                  Analytics, relationships, and decisions—held in one composed workspace
                  for the people moving Luxa forward.
                </p>
                <ArrowUpRight
                  className="size-5 shrink-0 text-primary"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-12 xl:px-16">
          <header className="flex items-center justify-between lg:justify-end">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="grid size-9 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                L
              </span>
              <span className="text-sm font-semibold">Luxa</span>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              Protected workspace
            </p>
          </header>

          <div className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-[25rem]">
              <div className="mb-9">
                <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-primary uppercase">
                  Welcome back
                </p>
                <h2 className="mt-3 text-[clamp(2rem,4vw,2.65rem)] leading-[1.05] font-semibold tracking-[-0.045em] text-card-foreground">
                  Enter your workspace
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                  Sign in with your authorized Luxa credentials.
                </p>
              </div>
              <LoginForm />
            </div>
          </div>

          <footer className="flex items-center justify-between border-t border-border pt-5 text-[0.6875rem] text-muted-foreground">
            <span>Private access only</span>
            <span>Luxa Operations · 2026</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
