# Architecture Decision: Zod vs. Class-Validator Strategy (`#990`)

**Status:** Accepted  
**Date:** September 2026  
**Epic:** Foundation & Scaffolding (`Chordially/Chordially`)

---

## Context & Problem Statement
`@chordially/shared` exports Zod schemas (such as `loginSchema`, `updateMeSchema`, etc.) which are consumed by both web and mobile frontends for client-side form validation and payload pre-validation. Meanwhile, the NestJS backend utilizes `class-validator` and `class-transformer` decorators for DTO validation within API controllers and pipes.

This creates architectural duplication: the same validation rules (e.g., email format, password minimum length, string constraints) must be maintained across both Zod schemas in `@chordially/shared` and NestJS `class-validator` DTOs. 

We evaluated whether to eliminate duplication (e.g., via runtime schema conversion libraries like `nestjs-zod`) or embrace accepted duplication with clear documentation and strict boundaries.

---

## Decision
We choose **Approach A: Keep Zod schemas in `@chordially/shared` as the single source of truth for client-side validation, while NestJS DTOs independently re-declare rules using `class-validator`** (accepted duplication with documented rationale).

### Why this approach?
1. **Frontend Ergonomics & Type Safety:** Zod integrates seamlessly with React Hook Form (`@hookform/resolvers/zod`) and TypeScript inference (`z.infer<typeof schema>`), providing an exceptional developer experience on web and mobile.
2. **Framework Decoupling:** NestJS validation (`class-validator`) is deeply coupled to class decorators and Nest's validation pipe lifecycle. Forcing runtime bridges (`nestjs-zod`) introduces complex build-time dependencies, opaque error mapping, and tight coupling between our cross-platform shared package and backend framework choices.
3. **Controlled Trade-off:** The validation rules for our core domain entities change infrequently. The minor overhead of duplicating simple validation rules is vastly outweighed by the stability, independence, and simplicity of keeping frontend and backend validation mechanisms native to their respective ecosystems.

---

## Guidelines & Maintenance
* **Single Source of Truth (Frontend):** `@chordially/shared` Zod schemas remain authoritative for all client-side inputs.
* **Backend Autonomy:** NestJS backend DTOs will use standard `class-validator` decorators mirroring these rules.
* **Synchronization:** Code review practices ensure that whenever business validation constraints change (e.g., password complexity requirements), both the Zod schema and corresponding `class-validator` DTO are updated in tandem.


# Architecture Decision: ESM vs. CommonJS Module Strategy for NestJS (`#984`)

**Status:** Accepted  
**Date:** September 2026  
**Epic:** Foundation & Scaffolding (`Chordially/Chordially`)

---

## Context & Problem Statement
The broader Chordially monorepo (`web`, `@chordially/shared`, and other microservices) is standardized on modern ESM (`NodeNext` module resolution with `"type": "module"` in `package.json`). 

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