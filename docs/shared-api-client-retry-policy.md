# Shared API Client Retry Policy Specification

This document details the shared exponential backoff and retry policy implementation for handling transient API network errors across Chordially packages.

## Overview

1. **Retry Handler & Options**:
   - `packages/shared/src/utils/api-retry-handler.ts`: `ApiRetryHandler` executing functions with configurable exponential backoff delays.
   - `retryPolicyOptionsSchema`: Zod schema defining max retry limits, backoff factors, and retryable status codes (408, 429, 500, 502, 503, 504).

2. **Web Client Integration**:
   - `apps/web/src/lib/api-retry-client-wrapper.ts`: Wrapper around `fetch` incorporating automatic transient error retries.
