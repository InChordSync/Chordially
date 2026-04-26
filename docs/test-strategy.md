# Test Strategy

This document defines the testing approach across all packages in the Chordially monorepo.

## Testing Pyramid

```
        /\
       /e2e\
      /------\
     /integra-\
    /  tion    \
   /------------\
  /    unit      \
 /-----------------\
```

- **Unit tests** form the base — fast, isolated, numerous
- **Integration tests** sit in the middle — test component/service boundaries
- **E2E tests** sit at the top — few, slow, but high confidence

## Tooling

| Layer       | Tool       | Purpose                                      |
|-------------|------------|----------------------------------------------|
| Unit        | Vitest     | Fast unit tests for utilities, hooks, logic  |
| API Integration | Supertest | HTTP-level tests against the Express/NestJS API |
| E2E         | Playwright | Full browser/flow tests for critical user journeys |

## Coverage Targets

- **Unit**: minimum 80% line and branch coverage enforced in CI
- **Integration**: all critical API paths must have at least one integration test
- **E2E**: cover the primary user flows (auth, chord creation, sharing)

## Folder Conventions

| File pattern            | Type        |
|-------------------------|-------------|
| `*.spec.ts`             | Unit test   |
| `*.integration.ts`      | Integration test |
| `tests/e2e/**/*.ts`     | E2E test    |

## CI Enforcement

- Vitest runs on every pull request; failures block merge
- Coverage thresholds are checked via `vitest --coverage`; falling below 80% fails the CI step
- Supertest integration tests run against a test database spun up via Docker Compose
- Playwright E2E tests run on merge to `main` against a staging deployment

## Naming Conventions

- Test files live adjacent to the source file they test, except integration and E2E files which live in a dedicated `tests/` directory
- Describe blocks should mirror the module name; `it` blocks should read as plain-English sentences
- Use `beforeEach`/`afterEach` for setup and teardown; avoid shared mutable state between tests
