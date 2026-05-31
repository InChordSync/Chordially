# Chordially

Chordially is a clean open source hackathon starter for building a music, creator, or fan engagement product with a TypeScript monorepo.

## Workspace layout

- `apps/api`: Express API starter with authentication-first routes.
- `apps/web`: Next.js web client for the contributor-facing product shell.
- `apps/mobile`: Expo mobile workspace for MVP flows.
- `apps/stellar-service`: Dedicated Stellar integration service.
- `packages/config`: Shared TypeScript and repository defaults.
- `packages/types`: Shared domain and API types.

## Why this reset exists

The previous product implementation has been retired in favor of a fresh contributor-friendly baseline. This repository now focuses on:

- a clear monorepo structure,
- a minimal but runnable app set,
- an authentication-first MVP path,
- clean public contribution starting points.

## Quick start

```bash
pnpm install
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
pnpm dev:stellar
```

## MVP roadmap

1. Authentication across API, web, and mobile.
2. Shared user profile and session state.
3. Stellar wallet and payment primitives.
4. Creator and fan MVP flows.
5. Moderation, operations, and launch hardening.

## Contributing

This repository is being prepared for public hackathon contributors. Keep changes small, documented, and aligned with the current MVP milestone.
