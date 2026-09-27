# Health & Readiness Deployment Probes Guide

This document specifies the deployment probe endpoints (`/healthz` and `/readyz`), subsystem connectivity validation, and probe response schemas in Chordially.

## Probes & Endpoints

1. **Deployment Probes Controller**:
   - `apps/api/src/modules/health/controllers/deployment-probes.controller.ts`: Controller returning liveness uptime and readiness subsystem status payloads.

2. **Web Monitoring Client**:
   - `apps/web/src/lib/deployment-probe-client.ts`: Utility functions `fetchLivenessProbe` and `fetchReadinessProbe`.

3. **Validation Schemas & Interfaces**:
   - `livenessProbeResponseSchema` and `readinessProbeResponseSchema` defined in `@chordially/shared`.
