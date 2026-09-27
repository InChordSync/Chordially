import { z } from 'zod';

export const loggerLogLevelSchema = z.enum(['info', 'warn', 'error', 'debug']);

export const requestTraceContextSchema = z.object({
  traceId: z.string().min(1),
  requestId: z.string().min(1),
  clientIp: z.string().optional(),
  userAgent: z.string().optional(),
});

export const structuredLogEntrySchema = z.object({
  level: loggerLogLevelSchema,
  message: z.string().min(1),
  method: z.string().min(1),
  path: z.string().min(1),
  statusCode: z.number().int(),
  durationMs: z.number().min(0),
  trace: requestTraceContextSchema,
  timestamp: z.string().min(1),
});

export type StructuredLogEntryInput = z.infer<typeof structuredLogEntrySchema>;
