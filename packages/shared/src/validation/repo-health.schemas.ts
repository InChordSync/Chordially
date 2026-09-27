import { z } from 'zod';

export const triageSeverityLevelSchema = z.enum(['critical', 'moderate', 'low']);
export const techDebtCategorySchema = z.enum([
  'dependency_staleness',
  'test_coverage_gap',
  'bundle_bloat',
  'deprecated_api',
]);

export const healthCheckMetricSchema = z.object({
  metricId: z.string().min(1, 'Metric ID is required.'),
  name: z.string().min(1, 'Metric name is required.'),
  category: techDebtCategorySchema,
  currentValue: z.number(),
  thresholdValue: z.number(),
  severity: triageSeverityLevelSchema,
});

export const repoHealthReportSchema = z.object({
  score: z.number().min(0).max(100),
  evaluatedAt: z.string().min(1),
  metrics: z.array(healthCheckMetricSchema),
  actionRequired: z.boolean(),
});

export type HealthCheckMetricInput = z.infer<typeof healthCheckMetricSchema>;
export type RepoHealthReportInput = z.infer<typeof repoHealthReportSchema>;
