export type TriageSeverityLevel = 'critical' | 'moderate' | 'low';
export type TechDebtCategory = 'dependency_staleness' | 'test_coverage_gap' | 'bundle_bloat' | 'deprecated_api';

export interface HealthCheckMetric {
  metricId: string;
  name: string;
  category: TechDebtCategory;
  currentValue: number;
  thresholdValue: number;
  severity: TriageSeverityLevel;
}

export interface RepoHealthReport {
  score: number;
  evaluatedAt: string;
  metrics: HealthCheckMetric[];
  actionRequired: boolean;
}
