import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary/12 text-primary',
        secondary: 'border-border bg-secondary text-secondary-foreground',
        violet: 'border-muted-foreground/30 bg-muted-foreground/12 text-muted-foreground',
        teal: 'border-success/30 bg-success/12 text-success',
        warm: 'border-warning/35 bg-warning/12 text-warning',
        destructive: 'border-destructive/35 bg-destructive/12 text-destructive',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
