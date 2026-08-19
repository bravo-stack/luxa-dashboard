export type ConcurrencyLimiter = <T>(task: () => Promise<T>) => Promise<T>;

export function createConcurrencyLimiter(maxConcurrency: number): ConcurrencyLimiter {
  if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1) {
    throw new Error('maxConcurrency must be a positive integer.');
  }

  let activeCount = 0;
  const queue: Array<() => void> = [];

  const drain = () => {
    while (activeCount < maxConcurrency) {
      const next = queue.shift();

      if (!next) {
        return;
      }

      activeCount += 1;
      next();
    }
  };

  return <T>(task: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      queue.push(() => {
        void (async () => {
          try {
            resolve(await task());
          } catch (error) {
            reject(error);
          } finally {
            activeCount -= 1;
            drain();
          }
        })();
      });

      drain();
    });
}
