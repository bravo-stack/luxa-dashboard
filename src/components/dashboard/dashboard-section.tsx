import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type DashboardSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardSection({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: DashboardSectionProps) {
  const headingId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-heading`;

  return (
    <section className={cn('space-y-4', className)} aria-labelledby={headingId}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={headingId}
            className="text-xl font-semibold tracking-[-0.025em] text-foreground"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
