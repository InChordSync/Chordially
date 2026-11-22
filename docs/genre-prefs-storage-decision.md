# `genrePrefs` storage strategy decision (N-045 / N-046)

## Context

`FanProfile.genrePrefs` needs to store an array of genre strings per fan. The two options:

- **Postgres native array**: `genrePrefs String[] @default([])`
- **JSON-string bridge**: `genrePrefs String @default("[]")`, with the application layer doing `JSON.parse`/`JSON.stringify` at the repository boundary

SQLite has no native array column type, so the JSON-string bridge is the only option while on SQLite; Postgres supports both.

## Current database provider

`apps/api/prisma/schema.prisma` currently declares:

```prisma
datasource db {
  provider = "sqlite"
  ...
}
```

The database migration to Postgres referenced by N-046 has **not yet landed** — this repo is still on SQLite as of this decision.

## Decision

**Stay on the JSON-string bridge, ported as-is** (the acceptance criteria's "if staying on SQLite" branch), since the underlying database is still SQLite. `apps/api/src/modules/fans/repositories/fan.repository.ts` already implements this correctly:

```ts
genrePrefs: JSON.parse(raw.genrePrefs) as string[]   // read
data: { genrePrefs: JSON.stringify(genrePrefs) }      // write
```

No change to the repository or schema was needed for the current SQLite deployment — this document exists because N-045/N-046 both asked for the decision to be recorded, not because the bridge was missing or broken.

## Revisit trigger

When N-046's Postgres migration actually lands, revisit this decision:

1. Change `schema.prisma`'s `genrePrefs` column to `String[] @default([])`.
2. Remove the `JSON.parse`/`JSON.stringify` calls in `fan.repository.ts` — Prisma's Postgres array support returns `string[]` directly, so `fromPrisma`'s mapping simplifies to a passthrough for that field.
3. Write a data migration that parses every existing row's JSON-string `genrePrefs` into a real array column — this is a one-way migration; do not ship it without a tested rollback path, since a failed parse on a malformed existing row would need explicit handling (default to `[]` and log, rather than fail the whole migration).
