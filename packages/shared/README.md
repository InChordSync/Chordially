# Architecture Decision: Zod request validation (`#1320`)

**Status:** Accepted  
**Date:** November 2026

---

## Context

`@chordially/shared` and API modules already define Zod schemas, but request
bodies were inconsistently typed and validated. Several `@Body()` handlers
accepted `any`, and some skipped validation entirely.

## Decision

The NestJS API uses a reusable `ZodValidationPipe` with existing shared or
module-local Zod schemas as the request-body validation source of truth. This
keeps API inputs inferred from their schemas and applies validation before
controller logic runs, without maintaining duplicate DTO rules.

## Guidelines

* Reuse `@chordially/shared` schemas when the request shape is shared with
  clients; keep API-specific schemas in the owning module's `validators/`.
* Apply `ZodValidationPipe` to every Nest `@Body()` parameter and type the
  parameter from the same schema.
* Keep validation error details in the API's standard error envelope.

# Architecture Decision: ESM vs. CommonJS Module Strategy for NestJS (`#984`)

**Status:** Accepted  
**Date:** September 2026  
**Epic:** Foundation & Scaffolding (`Chordially/Chordially`)

---

## Context & Problem Statement

The broader Chordially monorepo (`web`, `@chordially/shared`, and other microservices) is standardized on modern ESM (`NodeNext` module resolution with `"type": "module"`).

However, NestJS backend applications historically and natively align with CommonJS due to TypeScript decorator metadata reflection (`emitDecoratorMetadata`), Jest testing ecosystem stability, and dependency injection container resolution. We needed to decide whether to force NestJS into ESM mode or adopt CommonJS for `apps/api-nest`, and evaluate how this impacts consuming our ESM-based `@chordially/shared` package.

---

## Decision

We choose **CommonJS (`"type": "commonjs"` or omitting `"type"` in `apps/api-nest/package.json`) for `apps/api-nest`**, while maintaining ESM across `@chordially/shared`, `web`, and other packages via dual-package publishing or bundled compilation in the monorepo build pipeline.

### Trade-off Analysis & Rationale

1. **NestJS Stability & Decorators:** Running NestJS under native Node.js ESM (`NodeNext`) introduces well-documented friction with TypeScript experimental decorators, path aliases, Jest ESM transformers, and third-party CommonJS libraries. Sticking to CommonJS for the NestJS backend ensures 100% stability, fast test execution, and seamless DI metadata reflection.
2. **Consuming `@chordially/shared`:** Because `@chordially/shared` is authored in ESM (`NodeNext`), `apps/api-nest` needs to consume it successfully. To support this without runtime import crashes, our monorepo build pipeline compiles `@chordially/shared` into dual outputs (or bundles it via tsup/esbuild during the NestJS build step) ensuring CommonJS compatibility.

---

## Configuration & Implementation

* **`apps/api-nest/package.json`:** Explicitly configured without `"type": "module"` (defaulting to CommonJS).
* **Build Pipeline:** `@chordially/shared` exports both ESM and CJS entry points via `package.json` exports maps, allowing seamless import from both ESM frontend apps and the CommonJS NestJS backend.
