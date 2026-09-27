# Local Mock API Server Mode Specification

This document outlines the local mock API server mode configuration, artificial latency options, and frontend toggle integration in Chordially.

## Architecture

1. **Mock Server Service**:
   - `apps/api/src/modules/dev/services/local-mock-api-server.service.ts`: `LocalMockApiServerService` managing mock route handlers.
   - `mockServerConfigSchema`: Zod schema validating route patterns, artificial delays, and failure simulation rates.

2. **Web Toggle Integration**:
   - `apps/web/src/lib/mock-api-server-toggle.ts`: Utility function `isMockApiServerEnabled` checking environment flags and query params.
