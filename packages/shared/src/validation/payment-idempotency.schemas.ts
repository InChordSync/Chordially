import { z } from 'zod';

export const idempotencyKeyRecordSchema = z.object({
  key: z.string().uuid('Idempotency key must be a valid UUID.'),
  requestPath: z.string().min(1),
  responseBody: z.record(z.unknown()),
  statusCode: z.number().int().default(200),
  createdAt: z.string().min(1),
});

export const duplicateCheckResultSchema = z.object({
  isDuplicate: z.boolean(),
  previousResponse: z.record(z.unknown()).optional(),
  lockedAt: z.string().optional(),
});

export type IdempotencyKeyRecordInput = z.infer<typeof idempotencyKeyRecordSchema>;
export type DuplicateCheckResultInput = z.infer<typeof duplicateCheckResultSchema>;
