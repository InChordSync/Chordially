# Repository Health Dashboard & Tech Debt Triage Guide

This document specifies the repo health scoring rules, technical debt metric categories, and triage dashboard components in Chordially.

## Architecture & Scoring

1. **Evaluator Service**:
   - `apps/api/src/modules/health/services/repo-health-evaluator.service.ts`: Service evaluating dependency staleness, coverage gaps, and bundle sizes.

2. **Web Dashboard Component**:
   - `RepoHealthDashboardCard`: React component displaying repository health scorecards and triage status indicators.

3. **Validation Schemas & Interfaces**:
   - `repoHealthReportSchema` and `HealthCheckMetric` defined in `@chordially/shared`.
