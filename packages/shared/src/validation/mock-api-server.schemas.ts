import { z } from 'zod';

export const mockResponseDelayOptionsSchema = z.object({
  minDelayMs: z.number().int().min(0).default(50),
  maxDelayMs: z.number().int().min(0).default(300),
  simulatedFailureRate: z.number().min(0).max(1).default(0),
});

export const mockRouteHandlerSchema = z.object({
  pathPattern: z.string().min(1, 'Path pattern is required.'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  statusCode: z.number().int().default(200),
  mockResponseBody: z.record(z.unknown()).default({}),
});

export const mockServerConfigSchema = z.object({
  isEnabled: z.boolean().default(false),
  port: z.number().int().positive().default(4001),
  delayOptions: mockResponseDelayOptionsSchema.default({}),
  routes: z.array(mockRouteHandlerSchema).default([]),
});

export type MockServerConfigInput = z.infer<typeof mockServerConfigSchema>;
