# Observability Setup

- **Sentry Integration**: Added global exception filter that reports all unhandled 5xx errors to Sentry. (N-101)
- **Correlation IDs**: A global middleware generates and propagates an `x-correlation-id` header to downstream microservices and logs. (N-099)
- **Health Check**: Available at `/api/health` via `@nestjs/terminus`.
- **Metrics**: Available at `/api/metrics` in Prometheus format.
