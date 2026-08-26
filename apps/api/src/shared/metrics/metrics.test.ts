import { beforeEach, describe, expect, it } from "vitest"
import { metrics } from "./metrics.js"

beforeEach(() => {
  metrics.reset()
})

describe("metrics", () => {
  it("accumulates counters across increments", () => {
    metrics.incrementCounter("tip_confirmed_total")
    metrics.incrementCounter("tip_confirmed_total")
    metrics.incrementCounter("tip_retry_total", 3)

    const snapshot = metrics.getSnapshot()
    expect(snapshot.counters.tip_confirmed_total).toBe(2)
    expect(snapshot.counters.tip_retry_total).toBe(3)
  })

  it("summarizes observed latencies", () => {
    for (const ms of [100, 200, 300, 400, 500]) {
      metrics.observeLatency("tip_confirmation_latency_ms", ms)
    }

    const snapshot = metrics.getSnapshot()
    const histogram = snapshot.histograms.tip_confirmation_latency_ms!

    expect(histogram.count).toBe(5)
    expect(histogram.avgMs).toBe(300)
    expect(histogram.minMs).toBe(100)
    expect(histogram.maxMs).toBe(500)
  })

  it("gauges overwrite their previous reading rather than accumulating", () => {
    metrics.setGauge("stellar_sponsor_balance_xlm", 500)
    metrics.setGauge("stellar_sponsor_balance_xlm", 480)

    const snapshot = metrics.getSnapshot()
    expect(snapshot.gauges.stellar_sponsor_balance_xlm).toBe(480)
  })

  it("returns an empty summary for a histogram with no samples", () => {
    const snapshot = metrics.getSnapshot()
    expect(snapshot.histograms.nonexistent).toBeUndefined()
  })

  it("reset clears all recorded state", () => {
    metrics.incrementCounter("x")
    metrics.observeLatency("y", 10)
    metrics.reset()

    const snapshot = metrics.getSnapshot()
    expect(snapshot.counters).toEqual({})
    expect(snapshot.histograms).toEqual({})
  })
})
