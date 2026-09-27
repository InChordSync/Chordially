import { z } from 'zod';

export const exponentialBackoffSchema = z.object({
  initialDelayMs: z.number().int().positive().default(300),
  maxDelayMs: z.number().int().positive().default(5000),
  backoffFactor: z.number().positive().default(2),
});

export const retryPolicyOptionsSchema = z.object({
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryableStatusCodes: z.array(z.number().int()).default([408, 429, 500, 502, 503, 504]),
  backoff: exponentialBackoffSchema.default({}),
});

export type RetryPolicyOptionsInput = z.infer<typeof retryPolicyOptionsSchema>;
