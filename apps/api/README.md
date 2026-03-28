# API data bootstrap

This branch adds the MVP domain schema, an initial migration snapshot, and local demo data.

## Local setup

1. Install dependencies from `apps/api`
2. Copy `.env.example` to `.env`
3. Run `pnpm prisma:generate`
4. Run `pnpm prisma:migrate`
5. Run `pnpm prisma:seed`

## Seeded personas

- `admin-console`: seeded admin with operations access
- `novachords`: demo artist profile with a verified wallet
- `chordfan`: demo fan account with tip history

## Notes

- The migration is checked in as SQL so it can be reviewed independently of Prisma CLI state.
- The seed is idempotent for local resets because it clears tables before recreating demo data.
