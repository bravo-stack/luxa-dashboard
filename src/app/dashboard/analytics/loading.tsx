import { LoadingCard } from '@/components/dashboard/loading-card';

export default function Loading() {
  return (
    <div className="space-y-8">
      <LoadingCard className="min-h-48" rows={2} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingCard key={index} rows={3} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingCard key={index} className="min-h-80" rows={7} />
        ))}
      </div>
    </div>
  );
}
