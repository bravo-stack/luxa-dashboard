import { LoadingCard } from '@/components/dashboard/loading-card';

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="surface-liquid-glass rounded-3xl p-8">
        <div className="h-4 w-32 animate-pulse rounded-full bg-primary/20" />
        <div className="mt-5 h-10 w-80 max-w-full animate-pulse rounded-2xl bg-white/8" />
        <div className="mt-4 h-4 w-lg max-w-full animate-pulse rounded-full bg-white/6" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingCard key={index} rows={3} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <LoadingCard className="min-h-96" rows={8} />
        <LoadingCard className="min-h-96" rows={8} />
      </div>
    </div>
  );
}
