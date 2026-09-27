import {
  repoHealthReportSchema,
  type RepoHealthReport,
} from '@chordially/shared';

export class RepoHealthEvaluatorService {
  public evaluateRepoHealth(): RepoHealthReport {
    const report: RepoHealthReport = {
      score: 92,
      evaluatedAt: new Date().toISOString(),
      metrics: [
        {
          metricId: 'm_dep_01',
          name: 'Stale Dependencies Count',
          category: 'dependency_staleness',
          currentValue: 2,
          thresholdValue: 5,
          severity: 'low',
        },
        {
          metricId: 'm_cov_02',
          name: 'Core Coverage Gap',
          category: 'test_coverage_gap',
          currentValue: 88,
          thresholdValue: 80,
          severity: 'low',
        },
      ],
      actionRequired: false,
    };

    return repoHealthReportSchema.parse(report);
  }
}
