# Testing

## Running tests

```bash
# everything (via turbo)
pnpm test

# a single package
pnpm --filter @chordially/api test
pnpm --filter @chordially/web test
pnpm --filter @chordially/mobile test
pnpm --filter @chordially/shared test
```

## apps/api

- **Runner**: vitest + supertest, against the Express app (no real HTTP
  server is started).
- **Database**: tests run against a dedicated SQLite database configured via
  `apps/api/.env.test`. The `test` script runs `prisma db push` against that
  database before running vitest, and a global `beforeEach` hook
  (`tests/setup.ts`) clears the `User` table between tests.
- **Coverage**: registration (success, duplicate email, invalid input), login
  (success, invalid credentials, unknown account), and the `requireAuth`
  middleware (valid token, missing token, invalid token).
- Test files run sequentially (`fileParallelism: false`) to avoid SQLite lock
  contention.

## apps/web

- **Runner**: vitest + @testing-library/react + jsdom.
- Tests render the `/login` and `/register` pages inside `AuthProvider`,
  mocking `lib/auth-client` so no real network calls are made, and assert
  that the expected fields render and that client-side validation errors
  (from the shared zod schemas) are shown.

## apps/mobile

- **Runner**: Jest with the `jest-expo` preset and
  `@testing-library/react-native`.
- Currently contains a single smoke test that renders `App` and asserts it
  mounts without crashing.

## packages/shared

- **Runner**: vitest.
- Tests cover the `registerSchema` and `loginSchema` validation rules
  (valid/invalid emails, password complexity, required fields).

## What CI runs

Each package has its own GitHub Actions workflow under
`.github/workflows/` that installs dependencies and runs the relevant
`turbo run` tasks (`lint`, `test`, and `build` where applicable) scoped to
that package with `--filter`. A pull request only needs to pass the
workflows for the packages it touches (plus any packages that depend on
them, via turbo's dependency graph).
