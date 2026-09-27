import { z } from 'zod';

export const subsystemHealthStatusSchema = z.object({
  subsystemName: z.string().min(1),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  latencyMs: z.number().int().min(0),
});

export const livenessProbeResponseSchema = z.object({
  status: z.enum(['live', 'dead']),
  uptimeSeconds: z.number().min(0),
  timestamp: z.string().min(1),
});

export const readinessProbeResponseSchema = z.object({
  status: z.enum(['ready', 'not_ready']),
  databaseConnected: z.boolean(),
  cacheConnected: z.boolean(),
  subsystems: z.array(subsystemHealthStatusSchema),
  timestamp: z.string().min(1),
});

export type LivenessProbeResponseInput = z.infer<typeof livenessProbeResponseSchema>;
export type ReadinessProbeResponseInput = z.infer<typeof readinessProbeResponseSchema>;
