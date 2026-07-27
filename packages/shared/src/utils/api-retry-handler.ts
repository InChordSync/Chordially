import {
  retryPolicyOptionsSchema,
  type RetryPolicyOptionsInput,
} from '../validation/api-retry-policy.schemas.js';

export class ApiRetryHandler {
  public static async executeWithRetry<T>(
    fn: () => Promise<T>,
    options?: Partial<RetryPolicyOptionsInput>
  ): Promise<T> {
    const config = retryPolicyOptionsSchema.parse(options ?? {});
    let attempt = 0;
    let delay = config.backoff.initialDelayMs;

    while (attempt <= config.maxRetries) {
      try {
        return await fn();
      } catch (error: unknown) {
        attempt++;
        if (attempt > config.maxRetries) {
          throw error;
        }

        const errObj = error as { status?: number; statusCode?: number };
        const statusCode = errObj?.status ?? errObj?.statusCode;
        if (statusCode && !config.retryableStatusCodes.includes(statusCode)) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * config.backoff.backoffFactor, config.backoff.maxDelayMs);
      }
    }

    throw new Error('Retry attempts exhausted');
  }
}
