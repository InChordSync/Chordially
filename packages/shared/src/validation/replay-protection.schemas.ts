import { z } from 'zod';

export const nonceReplayCacheOptionsSchema = z.object({
  ttlSeconds: z.number().int().positive().default(600),
  maxCacheEntries: z.number().int().positive().default(10000),
});

export const challengeValidationResultSchema = z.object({
  isValid: z.boolean(),
  reason: z.enum(['expired', 'already_used', 'invalid_signature']).optional(),
  validatedAt: z.string().min(1),
});

export type NonceReplayCacheOptionsInput = z.infer<typeof nonceReplayCacheOptionsSchema>;
export type ChallengeValidationResultInput = z.infer<typeof challengeValidationResultSchema>;
