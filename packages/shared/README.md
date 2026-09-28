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