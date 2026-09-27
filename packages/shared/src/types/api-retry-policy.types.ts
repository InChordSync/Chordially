export interface ExponentialBackoffConfig {
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

export interface RetryPolicyOptions {
  maxRetries: number;
  retryableStatusCodes: number[];
  backoff: ExponentialBackoffConfig;
}

export interface RetryAttemptLog {
  attemptNumber: number;
  delayAppliedMs: number;
  statusCode?: number;
  errorMessage?: string;
  timestamp: string;
}
