# Auth Implementation Guide

A quick-start reference for contributors picking up a Batch 1 auth issue.

## Architecture overview

Authentication is handled by `apps/api` and shared via `packages/types` and `packages/config`.
The web and mobile clients consume the API over HTTP; Stellar sits behind its own service.

```
packages/types          shared contracts, AuthUser, AuthSession, RefreshToken, AuthErrorCode
packages/config         authDefaults, normalizeAuthError
apps/api                auth store, token service, middleware, routes
apps/web                session state, route guards, auth forms
apps/mobile             local session restore, auth input flows
apps/stellar-service    wallet-linked auth (future; currently isolated)
```

## Key files

| File | Purpose |
|---|---|
| `apps/api/src/auth-store.ts` | In-memory user, session, and refresh-token store |
| `apps/api/src/token-service.ts` | JWT sign/verify (swap target for real key management) |
| `apps/api/src/auth-middleware.ts` | Bearer token extraction and session validation |
| `apps/api/src/authz-middleware.ts` | Role-based access control |
| `apps/api/src/lockout-store.ts` | Failed-attempt tracking and lockout window |
| `apps/api/src/reset-store.ts` | Password-reset token lifecycle |
| `apps/api/src/verification-store.ts` | Email-verification token lifecycle |
| `apps/api/src/env.ts` | Validated env vars (JWT_SECRET, TTLs, lockout thresholds) |
| `packages/types/src/index.ts` | `AuthUser`, `AuthSession`, `RefreshToken`, `UserRole` |
| `packages/types/src/auth-contracts.ts` | Request/response shapes and `AuthErrorCode` |
| `packages/config/auth-config.ts` | `authDefaults`, `normalizeAuthError` |

## Auth flow

1. `POST /auth/register` → creates user, returns `AuthUser`.
2. `POST /auth/login` → returns `AuthSession` (JWT) + opaque refresh token.
3. Subsequent requests carry the JWT as `Authorization: Bearer <token>`.
4. `POST /auth/refresh` rotates the refresh token and issues a new JWT.
5. `POST /auth/logout` revokes the session; `POST /auth/logout-all` revokes all sessions for the user.
6. `POST /auth/reset-password/request` + `POST /auth/reset-password/confirm` handle password resets.
7. `POST /auth/verify-email/confirm` activates a `pending_verification` account.

## Extending auth

- **New route**: add to `apps/api/src/app.ts`, protect with `authMiddleware` or `authzMiddleware`.
- **New role**: extend `UserRole` in `packages/types/src/index.ts`.
- **New error code**: extend `AuthErrorCode` in `packages/types/src/auth-contracts.ts`, add a message in `packages/config/auth-config.ts`.
- **New account state**: see `docs/contributor-account-states.md` for the state taxonomy.
- **Web guard**: add to `apps/web/lib/` and reference the session from the Next.js middleware.
- **Mobile session restore**: `EXPO_PUBLIC_AUTH_OFFLINE_RESTORE` controls this toggle (see `docs/auth-environment-matrix.md`).

## Environment variables

See `docs/auth-environment-matrix.md` for the full matrix.
Core vars: `JWT_SECRET`, `JWT_TTL_SECONDS`, `REFRESH_TTL_SECONDS`, `AUTH_LOCKOUT_MAX_ATTEMPTS`.
Copy `.env.example` in each app and fill values before running locally.

## Naming conventions

See `docs/auth-naming-glossary.md`. Use `session`, `accessToken`, `refreshToken`, and `verificationToken` consistently — do not invent synonyms.

## Test layout

- `apps/api/tests/` — unit and integration tests; call `resetAuthStore()` in `beforeEach`.
- Fixture profiles are defined in `docs/auth-fixtures-cross-platform.md`.
- Run tests: `pnpm --filter api test`.
