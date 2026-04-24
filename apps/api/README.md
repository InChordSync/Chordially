# API application skeleton

This branch adds a standalone Express application structure that can be merged even before the database layer.

## Available routes

- `GET /health`
- `GET /system/ready`

## Local setup

1. From the repository root, run `node scripts/bootstrap-local.mjs`
2. Or manually copy `.env.example` to `.env`
3. Run `pnpm install` from the repository root
4. Run `pnpm --filter @chordially/api check:env`
5. Run `pnpm dev:api`

## Notes

- Environment validation fails fast on boot so missing configuration is caught immediately.
- The route/module layout is intentionally small and safe to extend in later issues without restructuring again.
- Local infrastructure is provided through the repository `docker-compose.yml`.
