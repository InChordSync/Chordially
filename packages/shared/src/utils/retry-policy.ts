export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffFactor?: number;
  retryOn?: (error: unknown) => boolean;
}

const isTransient = (error: unknown): boolean => {
  if (error instanceof Error) {
    return /network|timeout|ECONNRESET|503|429/i.test(error.message);
  }
  return false;
};

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, delayMs = 500, backoffFactor = 2, retryOn = isTransient } = options;
  let lastError: unknown;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts || !retryOn(err)) throw err;
      await new Promise((r) => setTimeout(r, delay));
      delay *= backoffFactor;
    }
  }

  throw lastError;
}
