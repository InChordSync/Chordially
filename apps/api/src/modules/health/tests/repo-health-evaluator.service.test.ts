import { describe, expect, it } from "vitest"
import { RepoHealthEvaluatorService } from "../services/repo-health-evaluator.service.js"

describe("RepoHealthEvaluatorService", () => {
  const service = new RepoHealthEvaluatorService()

  it("returns a high health score with no action required", () => {
    const report = service.evaluateRepoHealth()
    expect(report.score).toBeGreaterThanOrEqual(80)
    expect(report.actionRequired).toBe(false)
  })

  it("reports health metrics with valid categories and severities", () => {
    const report = service.evaluateRepoHealth()
    expect(report.metrics.length).toBeGreaterThan(0)

    for (const metric of report.metrics) {
      expect(["dependency_staleness", "test_coverage_gap", "bundle_bloat", "deprecated_api"]).toContain(
        metric.category
      )
      expect(["critical", "moderate", "low"]).toContain(metric.severity)
    }
  })

  it("includes an evaluatedAt timestamp", () => {
    const report = service.evaluateRepoHealth()
    expect(new Date(report.evaluatedAt).getTime()).not.toBeNaN()
  })
})
