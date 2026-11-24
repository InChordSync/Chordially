import { describe, expect, it } from "vitest"
import { metrics } from "../metrics.js"
import { shouldServeDocs } from "../../config/docs.js"

describe("metrics.toPrometheus", () => {
  it("renders counters, gauges and histogram summaries", () => {
    metrics.reset()
    metrics.incrementCounter("tips_submitted", 3)
    metrics.setGauge("wallet_balance", 12.5)
    metrics.observeLatency("anchor_submit_ms", 100)
    metrics.observeLatency("anchor_submit_ms", 300)

    const text = metrics.toPrometheus()

    expect(text).toContain("# TYPE tips_submitted counter")
    expect(text).toContain("tips_submitted 3")
    expect(text).toContain("# TYPE wallet_balance gauge")
    expect(text).toContain("wallet_balance 12.5")
    expect(text).toContain("anchor_submit_ms_count 2")
    expect(text).toContain("anchor_submit_ms_p95_ms 300")
    metrics.reset()
  })
})

describe("shouldServeDocs", () => {
  it("allows docs in development and test", () => {
    expect(shouldServeDocs("development", true)).toBe(true)
    expect(shouldServeDocs("test", true)).toBe(true)
  })

  it("never exposes docs in production", () => {
    expect(shouldServeDocs("production", true)).toBe(false)
    expect(shouldServeDocs("production", false)).toBe(false)
  })

  it("respects DOCS_ENABLED outside production", () => {
    expect(shouldServeDocs("development", false)).toBe(false)
  })
})
