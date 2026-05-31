# Contributor Auth Implementation Guide

Issue: #398

This guide orients Batch 1 contributors around the reset starter's auth surfaces.
Use it before adding wallet-link, challenge, profile, or route-guard work so
changes land in the right app and keep the public starter approachable.

## Current Auth Shape

The repository is split by boundary:

- `apps/api`: owns account registration, login, session refresh, logout, email
  verification, password reset, and protected API examples.
- `apps/web`: calls the API from the Next.js app and renders contributor-facing
  auth screens.
- `apps/mobile`: mirrors the web auth client for Expo flows and mobile session
  restoration.
- `apps/stellar-service`: owns Stellar network metadata and future wallet-link
  or payment primitives.
- `packages/types`: defines shared request, response, error, session, user, and
  telemetry contracts.
- `packages/config`: keeps cross-app auth defaults and environment-facing
  configuration.

Keep new auth work close to the boundary that owns the behavior. Shared contracts
belong in `packages/types` only when more than one app consumes the same shape.

## Extension Map

| Work type | Start here | Shared contract needed? | Notes |
|---|---|---|---|
| Email/password API behavior | `apps/api/src/app.ts`, `apps/api/src/auth-store.ts` | Yes, for request or response changes | Keep error envelopes in `AuthErrorResponse`. |
| Protected API routes | `apps/api/src/auth-middleware.ts`, `apps/api/src/authz-middleware.ts` | Usually no | Return safe `401` or `403` messages without leaking account state. |
| Web auth screens | `apps/web/app/auth`, `apps/web/lib/auth-client.ts` | Yes, if API payload changes | Keep UI copy aligned with account restrictions and verification states. |
| Mobile auth flows | `apps/mobile/src/auth`, `apps/mobile/App.tsx` | Yes, if API payload changes | Preserve offline/session restore behavior when adding challenge states. |
| Wallet-link service behavior | `apps/stellar-service/src/app.ts` | Yes | Treat Stellar signing material as sensitive and avoid storing it in logs. |
| Cross-service telemetry | `apps/api/src/telemetry.ts`, `apps/stellar-service/src/telemetry.ts`, `packages/types/src/telemetry.ts` | Yes | Emit event names and outcomes, not personal data or signed payloads. |
| Repo docs and QA notes | `docs/` | No | Link paths and commands so future contributors can verify locally. |

## API Touchpoints

The API currently exposes these contributor auth routes:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/verify/request`
- `POST /api/v1/auth/verify/confirm`
- `POST /api/v1/auth/reset/request`
- `POST /api/v1/auth/reset/complete`
- `GET /api/v1/admin/users`

When adding or changing routes:

1. Put input validation near the route with `zod`.
2. Return the existing `{ error, message }` envelope for expected failures.
3. Keep account restriction details safe for clients, but not over-specific for
   unauthenticated callers.
4. Update shared response types in `packages/types/src/auth-contracts.ts` when
   web or mobile clients depend on the shape.
5. Add or update API tests under `apps/api/tests`.

## Client Touchpoints

Web and mobile should depend on shared contracts and local client wrappers:

- Web wrapper: `apps/web/lib/auth-client.ts`
- Mobile wrapper: `apps/mobile/src/auth/mobile-auth-client.ts`

When a new API route is needed by both clients, add the shared type first, then
add narrow wrapper methods in each client. Keep route strings in the wrappers so
screens do not duplicate endpoint paths.

For UI copy, distinguish:

- authentication: proving the contributor can access an account;
- identity linking: associating a Stellar wallet with that account;
- financial authorization: approving movement of funds or assets.

Wallet-link copy must not imply that linking a wallet authorizes payment,
transfer, signing, escrow, or payout behavior.

## Stellar Service Touchpoints

The Stellar service currently exposes:

- `GET /health`
- `GET /api/v1/stellar/network`
- `GET /api/v1/stellar/starter-intent`

Use `apps/stellar-service/src/app.ts` for service routes and keep network
configuration in `apps/stellar-service/src/env.ts`. Wallet-link work should keep
testnet and mainnet behavior explicit, especially when challenge payloads or
passphrases are involved.

Do not log:

- secret keys;
- signed transactions;
- raw challenge signatures;
- full access or refresh tokens;
- private account metadata.

Telemetry should use shared event names from `packages/types/src/telemetry.ts`
and carry only safe identifiers or aggregate outcomes.

## Local Verification

Use the smallest command that proves the changed boundary:

- Root check: `pnpm check`
- API only: `pnpm --filter @chordially/api test`
- API typecheck: `pnpm --filter @chordially/api typecheck`
- Web typecheck: `pnpm --filter @chordially/web typecheck`
- Mobile test: `pnpm --filter @chordially/mobile test`
- Stellar service test: `pnpm --filter @chordially/stellar-service test`

For docs-only changes, run `git diff --check` and make sure referenced paths
exist on the current branch.

## Contribution Checklist

Before opening an auth PR:

- Link the relevant issue in the PR body.
- Keep the PR scoped to one behavior or one contributor-facing guide.
- Mention which apps or packages were touched.
- Note any intentionally deferred follow-up, especially for wallet-link UI,
  Stellar signing, and payment authorization.
- Include the exact validation command output in the PR body.

This keeps Chordially useful as both a real product starter and a friendly
hackathon contribution surface.
