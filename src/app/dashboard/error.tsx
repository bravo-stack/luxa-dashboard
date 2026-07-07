'use client';

import { ErrorState } from '@/components/dashboard/error-state';
import { Button } from '@/components/ui/button';

export default function Error({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ErrorState
        className="w-full max-w-2xl"
        title="Command center paused"
        description="The dashboard could not load its operational data. Retry when the connection is stable."
      />
      <Button className="fixed bottom-8" onClick={() => unstable_retry()}>
        Retry dashboard
      </Button>
    </div>
  );
}
