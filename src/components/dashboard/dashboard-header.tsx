import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type DashboardHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

export function DashboardHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-6 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[clamp(1.75rem,3vw,2.35rem)] leading-[1.08] font-semibold tracking-[-0.035em] text-foreground">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        {meta ? <div className="mt-5">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
