import { LoadingCard } from '@/components/dashboard/loading-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="surface-premium rounded-lg p-7">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="mt-6 h-10 w-80 max-w-full" />
        <Skeleton className="mt-4 h-4 w-lg max-w-full" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <LoadingCard className="min-h-80" rows={6} />
          <LoadingCard className="min-h-96" rows={8} />
          <LoadingCard className="min-h-80" rows={6} />
        </div>
        <LoadingCard className="min-h-128" rows={10} />
      </div>
    </div>
  );
}
