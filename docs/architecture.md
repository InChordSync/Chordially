# Architecture

## Monorepo layout

Chordially is a pnpm + Turborepo workspace.

```txt
chordially/
├── apps/
│   ├── api/      @chordially/api    – Express modular monolith
│   ├── web/      @chordially/web    – Next.js web app
│   └── mobile/   @chordially/mobile – React Native / Expo app
│
├── packages/
│   ├── shared/   @chordially/shared – shared types and zod validation schemas
│   └── stellar/  @chordially/stellar – Stellar integration scaffold
│
├── .github/workflows/  – per-package CI
└── docs/                – this documentation
```

`packages/shared` is consumed directly from its TypeScript source (no build
step required) by both `apps/api` and `apps/web` via workspace dependencies.

## Backend: modular monolith

`apps/api` is an Express app organized as a **modular monolith**. Each domain
lives in its own module under `src/modules/<domain>/`, with a consistent
internal structure:

```txt
src/modules/<domain>/
├── controllers/   – request/response handling, calls into services
├── services/       – business logic
├── repositories/    – persistence (Prisma) – only where the module owns data
├── validators/      – request validation (zod schemas)
├── routes/           – Express routers
├── types/            – module-local types and DTOs
└── tests/            – module tests (vitest + supertest)
```

Cross-cutting concerns live under `src/shared/`:

```txt
src/shared/
├── config/      – environment loading and validation (zod)
├── database/     – Prisma client singleton
├── errors/        – AppError and other error types
├── logger/         – application logger
├── middleware/      – Express middleware (auth, error handling)
└── types/            – global type augmentations (e.g. Express Request)
```

### Current modules

- **`modules/auth`** – registration and login (`POST /api/auth/register`,
  `POST /api/auth/login`). Issues JWTs and validates credentials.
- **`modules/users`** – owns the `User` persistence layer (Prisma
  repository + service) that `modules/auth` depends on.

### Adding a new module

1. Create `src/modules/<domain>/` with the structure above (only add the
   subdirectories the module actually needs — e.g. a module with no
   persistence of its own can omit `repositories/`).
2. Define request/response types in `types/` and validation schemas in
   `validators/` (reuse `@chordially/shared` schemas where the same shape is
   used by the frontend).
3. Implement business logic in `services/`, calling into other modules'
   services (not their repositories) for cross-module data access.
4. Wire up `routes/` and mount the router in `src/app.ts`.
5. Add tests under `tests/` following the existing auth module tests as a
   template.

## Frontend: apps/web

`apps/web` is a Next.js (App Router) app. Routes that need authentication
state read from `AuthProvider` / `useAuth` (`lib/auth-context.tsx`), and API
calls go through `lib/auth-client.ts`. Form inputs are validated client-side
using the same zod schemas (`@chordially/shared`) that the API uses
server-side.

## Mobile: apps/mobile

`apps/mobile` is a React Native (Expo) + TypeScript foundation. The `src/`
directory is pre-structured for future feature work
(`components/`, `screens/`, `navigation/`, `hooks/`, `services/`, `utils/`,
`assets/`) but currently contains only placeholders — no authentication or
screens have been implemented yet.

## Stellar: packages/stellar

`packages/stellar` is a compile-only scaffold for the future Stellar payment
layer described in the project overview. It currently exports placeholder
types and interfaces only, with no blockchain or network logic.
