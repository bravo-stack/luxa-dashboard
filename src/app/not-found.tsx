import Link from 'next/link';
import { ArrowRight, MapPinOff } from 'lucide-react';

import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <AuthShell
      eyebrow="Route unavailable"
      title="This workspace path does not exist."
      description="The address may be incomplete or the destination may have moved. Return to Luxa and continue from your authorized workspace."
      statusLabel="Luxa secure routing"
    >
      <div className="grid gap-5 rounded-md border border-border bg-card p-5">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-primary">
            <MapPinOff className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-card-foreground">No page found</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              No account or workspace information was changed.
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="h-12 w-full">
          <Link href="/">
            Return to Luxa
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}
