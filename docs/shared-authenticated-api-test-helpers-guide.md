# Shared Authenticated API Test Helpers Specification

This document details the shared authentication test utilities, JWT mock header generators, and fixture builder abstractions in Chordially.

## Utilities & Fixture Builders

1. **Test Auth Header Generator**:
   - `packages/shared/src/utils/authenticated-test-client.ts`: `AuthenticatedTestClient` generating bearer tokens and test user identity headers.
   - `testUserContextSchema`: Zod schema validating test user context attributes.

2. **API Fixture Builder**:
   - `apps/api/src/test-utils/repeatable-fixture-builder.ts`: `RepeatableFixtureBuilder` generating test user & creator contexts.
