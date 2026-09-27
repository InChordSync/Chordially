# Structured API Request Logging Specification

This document details the structured JSON logging format, trace context propagation, and middleware implementations in Chordially.

## Architecture

1. **Request Logger Middleware**:
   - `apps/api/src/middleware/structured-request-logging.middleware.ts`: `StructuredRequestLogger` producing structured JSON logs for HTTP API requests.

2. **Web Client Logger**:
   - `apps/web/src/lib/client-logger-formatter.ts`: Utility function `logClientEvent`.

3. **Validation Schemas & Interfaces**:
   - `structuredLogEntrySchema` and `StructuredLogEntry` defined in `@chordially/shared`.
