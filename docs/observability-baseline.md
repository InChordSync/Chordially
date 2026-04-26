# Observability Stack Baseline

This document specifies the logging, metrics, and tracing tools the Chordially team uses so that every engineer has a consistent, queryable view of system health from day one.

## Three Pillars

### 1. Logs

**Tool:** [pino](https://github.com/pinojs/pino)

- All services must emit structured JSON logs via `pino`. No unstructured `console.log` calls in production code.
- Required fields on every log entry: `timestamp` (ISO 8601), `level`, `service`, `traceId`, `spanId`, `message`.
- Log levels follow standard semantics: `fatal`, `error`, `warn`, `info`, `debug`, `trace`. Default production level: `info`.
- Sensitive fields (tokens, passwords, email addresses) must be redacted before logging using `pino`'s `redact` option.
- Logs are shipped to a centralised log aggregation service (e.g., Loki or CloudWatch Logs) and indexed for querying.

**Naming convention for log sources:** `chordially.<service-name>` (e.g., `chordially.api`, `chordially.worker`).

### 2. Metrics

**Tools:** [Prometheus](https://prometheus.io/) + [Grafana](https://grafana.com/)

- Each service exposes a `/metrics` endpoint in the Prometheus text format, scraped every 15 seconds.
- Standard metrics to instrument in every service:
  - `http_request_duration_seconds` — histogram of request latency, labelled by `method`, `route`, and `status_code`.
  - `http_requests_total` — counter of total requests, same labels.
  - `process_cpu_seconds_total` and `process_resident_memory_bytes` — via the default Node.js Prometheus client.
- Custom business metrics must follow the naming pattern `chordially_<domain>_<metric>_<unit>` (e.g., `chordially_payments_tips_total`).

**Alert threshold examples:**

| Alert | Condition | Severity |
|---|---|---|
| High error rate | `rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05` | P1 |
| Latency spike | `histogram_quantile(0.95, http_request_duration_seconds_bucket) > 2` | P2 |
| Service down | `up == 0` for > 1 min | P0 |
| Memory pressure | `process_resident_memory_bytes > 512MB` | P2 |

**Dashboard naming convention:** `Chordially / <Domain> / <Service>` (e.g., `Chordially / Payments / API`). All dashboards live in the `chordially` Grafana folder and are version-controlled as JSON in `infra/grafana/dashboards/`.

### 3. Traces

**Tool:** [OpenTelemetry](https://opentelemetry.io/) (OTel)

- All services initialise the OpenTelemetry Node.js SDK at startup using automatic instrumentation for HTTP, gRPC, and database clients.
- Traces are exported to an OTel Collector, which forwards to the configured backend (Jaeger for local development, Tempo or AWS X-Ray for hosted environments).
- Every inbound HTTP request must propagate a `traceId` and `spanId` via the W3C `traceparent` header.
- The `traceId` must be included in log entries (see Logs section) to enable log-to-trace correlation in Grafana.
- Sampling strategy: 100% in development and staging; 10% head-based sampling in production with 100% sampling for error spans.

## Summary: Tool Choices

| Pillar | Tool | Transport / Backend |
|---|---|---|
| Logs | pino | Loki (local), CloudWatch Logs (production) |
| Metrics | Prometheus + Grafana | Prometheus scrape + Grafana dashboards |
| Traces | OpenTelemetry SDK | Jaeger (local), Tempo / X-Ray (production) |
