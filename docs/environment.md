# Environment Variables

Every app keeps a committed `.env.example` documenting the variables it
needs. Copy it to the file the app actually loads and fill in real values
for your environment. Never commit `.env`, `.env.local`, or any file
containing real secrets — only `.env.example` (and `apps/api/.env.test`,
which holds non-sensitive test-only values) are checked in.

## apps/api

Copy `apps/api/.env.example` to `apps/api/.env`:

| Variable         | Description                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `NODE_ENV`       | `development`, `test`, or `production`.                                                             |
| `LOG_LEVEL`      | Minimum severity the structured logger emits: `debug`, `info`, `warn`, or `error` (default `info`). |
| `PORT`           | Port the API server listens on (default `4000`).                                                    |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of origins allowed to make credentialed requests (e.g. `https://app.example.com,https://admin.example.com`). Required when `NODE_ENV=production`. |
| `SHUTDOWN_DRAIN_TIMEOUT_MS` | Maximum time granted to in-flight requests, SSE streams and database cleanup after SIGTERM (default `10000`). The process is force-exited after this point. |
| `DATABASE_URL`   | SQLite connection string for Prisma (e.g. `file:./dev.db`).                                         |
| `JWT_SECRET`     | Secret used to sign authentication JWTs.                                                            |
| `JWT_EXPIRES_IN` | JWT expiry (e.g. `1h`).                                                                             |
| `REGISTER_RATE_LIMIT_WINDOW_MS` / `REGISTER_RATE_LIMIT_MAX` | Registration attempts per account window (defaults: `60000` ms / `5`). |
| `LOGIN_RATE_LIMIT_WINDOW_MS` / `LOGIN_RATE_LIMIT_PER_ACCOUNT` / `LOGIN_RATE_LIMIT_PER_IP` | Login attempts per account and IP (defaults: `60000` ms / `5` per account / `20` per IP). |
| `API_RATE_LIMIT_WINDOW_MS` / `API_RATE_LIMIT_MAX` | Global API request window and limit (defaults: `60000` ms / `100`). |
| `AUTH_RATE_LIMIT_WINDOW_MS` / `AUTH_RATE_LIMIT_MAX` | Auth route request window and limit (defaults: `60000` ms / `5`). |
| `WALLET_LINK_CHALLENGE_RATE_LIMIT_WINDOW_MS` / `WALLET_LINK_CHALLENGE_RATE_LIMIT_MAX` | Wallet-link challenge window and limit (defaults: `60000` ms / `5`). |
| `CREATOR_PAYOUT_RATE_LIMIT_WINDOW_MS` / `CREATOR_PAYOUT_RATE_LIMIT_MAX` | Creator payout request window and limit (defaults: `60000` ms / `5`). |

`apps/api/.env.test` is committed with safe, test-only values and is used
automatically by the `test` script.

### Graceful shutdown

The API enables Nest shutdown hooks, so SIGTERM starts a drain: new requests
stop arriving, in-flight requests and SSE streams finish, tip-feed subscribers
are removed, and Prisma disconnects. Allow at least
`SHUTDOWN_DRAIN_TIMEOUT_MS` (10s by default) plus a small margin in the
container/orchestrator termination grace period. If draining exceeds the
timeout the process exits with status 1 so a supervisor can replace it.

## apps/web

Copy `apps/web/.env.example` to `apps/web/.env.local`:

| Variable              | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of `apps/api` (default `http://localhost:4000`). |

## apps/mobile

Copy `apps/mobile/.env.example` to `apps/mobile/.env`:

| Variable              | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL` | Base URL of `apps/api` (default `http://localhost:4000`). |

## Secrets handling

- Use long, random values for `JWT_SECRET` outside of local development.
- Do not commit real database URLs, API keys, or signing secrets.
- `.env.example` files should only ever contain placeholder or default
  values.

## Local Stellar network

`pnpm contracts:local:up` starts `docker-compose.stellar.yml` (Docker needs about 4 GB of memory) and
`pnpm contracts:local:deploy` writes these to `.env.local`:

| Variable                     | Value                                |
| ---------------------------- | ------------------------------------ |
| `STELLAR_NETWORK`            | `local`                              |
| `STELLAR_NETWORK_PASSPHRASE` | `Standalone Network ; February 2017` |
| `HORIZON_URL`                | `http://localhost:8000`              |
| `SOROBAN_RPC_URL`            | `http://localhost:8000/soroban/rpc`  |
| `FRIENDBOT_URL`              | `http://localhost:8000/friendbot`    |
