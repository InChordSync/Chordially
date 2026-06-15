# Contributing

## Coding standards

- TypeScript strict mode is enabled everywhere (`tsconfig.base.json`).
- ESLint (`eslint.config.mjs`) and Prettier (`.prettierrc.json`) configs are
  shared across the workspace — run `pnpm lint` and `pnpm format:check`
  before opening a PR, or `pnpm format` to fix formatting issues.
- Keep modules and packages within their existing structure — see
  [docs/architecture.md](./architecture.md) for the modular monolith
  convention used by `apps/api` and the overall monorepo layout.
- Add or update tests for any behavior you change — see
  [docs/testing.md](./testing.md).

## Project structure

See [docs/architecture.md](./architecture.md) for the full layout of
`apps/` and `packages/`, and the top-level [README](../README.md) for the
product overview and direction.

## Development workflow

1. Install dependencies: `pnpm install`.
2. Copy any `.env.example` files you need (see
   [docs/environment.md](./environment.md)) and fill in local values.
3. Run the app(s) you're working on: `pnpm dev:api`, `pnpm dev:web`, or
   `pnpm dev:mobile`.
4. Before committing, run:
   ```bash
   pnpm check
   ```
   which runs `lint`, `typecheck`, and `test` across the workspace.
5. Open a pull request against `main`. The CI workflows under
   `.github/workflows/` run lint/test/build for any package your change
   touches.

## Contribution expectations

- Keep changes focused and scoped to the area you're working on.
- Prefer extending the existing module/package structure over introducing
  new top-level layers.
- Do not commit secrets, `.env` files, or generated artifacts (`dist/`,
  `.next/`, `.expo/`, `*.db`).
