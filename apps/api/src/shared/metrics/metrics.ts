interface HistogramSummary {
  count: number
  sumMs: number
  avgMs: number
  minMs: number
  maxMs: number
  p95Ms: number
}

interface MetricsSnapshot {
  counters: Record<string, number>
  histograms: Record<string, HistogramSummary>
  gauges: Record<string, number>
}

const MAX_SAMPLES_PER_HISTOGRAM = 1000

/**
 * Minimal in-memory metrics registry: counters and latency histograms,
 * readable as a JSON snapshot via GET /api/metrics. This is intentionally
 * not a full Prometheus client — it's enough to satisfy this project's
 * observability goals (submission/confirmation latency, retry count,
 * reconciliation count, failure rate) for a single API instance. Swapping in
 * a real metrics backend (Prometheus, StatsD, etc) later would only require
 * changing this module, not any of its call sites.
 */
class MetricsRegistry {
  private readonly counters = new Map<string, number>()
  private readonly histograms = new Map<string, number[]>()
  private readonly gauges = new Map<string, number>()

  incrementCounter(name: string, amount = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + amount)
  }

  /** Records a point-in-time value (e.g. a balance) that overwrites its previous reading, unlike a counter. */
  setGauge(name: string, value: number): void {
    this.gauges.set(name, value)
  }

  observeLatency(name: string, ms: number): void {
    const samples = this.histograms.get(name) ?? []
    samples.push(ms)
    if (samples.length > MAX_SAMPLES_PER_HISTOGRAM) {
      samples.shift()
    }
    this.histograms.set(name, samples)
  }

  getSnapshot(): MetricsSnapshot {
    const counters: Record<string, number> = {}
    for (const [name, value] of this.counters) {
      counters[name] = value
    }

    const histograms: Record<string, HistogramSummary> = {}
    for (const [name, samples] of this.histograms) {
      histograms[name] = summarize(samples)
    }

    const gauges: Record<string, number> = {}
    for (const [name, value] of this.gauges) {
      gauges[name] = value
    }

    return { counters, histograms, gauges }
  }

  /** Test-only: clears all recorded state. */
  reset(): void {
    this.counters.clear()
    this.histograms.clear()
    this.gauges.clear()
  }
}

function summarize(samples: number[]): HistogramSummary {
  if (samples.length === 0) {
    return { count: 0, sumMs: 0, avgMs: 0, minMs: 0, maxMs: 0, p95Ms: 0 }
  }

  const sorted = [...samples].sort((a, b) => a - b)
  const sum = sorted.reduce((total, value) => total + value, 0)
  const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)

  return {
    count: sorted.length,
    sumMs: sum,
    avgMs: sum / sorted.length,
    minMs: sorted[0]!,
    maxMs: sorted[sorted.length - 1]!,
    p95Ms: sorted[p95Index]!,
  }
}

export const metrics = new MetricsRegistry()
export type { HistogramSummary, MetricsSnapshot }
