# Deployment Guide

## Environment Strategy

Chordially uses three environment targets: **local**, **preview**, and **production**.

Each app reads its configuration from environment variables. No secrets are hardcoded in source.

---

## Apps and their env files

| App | File | Prefix |
|-----|------|--------|
| `apps/api` | `.env` | — |
| `apps/web` | `.env.local` | `NEXT_PUBLIC_` for client-exposed vars |
| `apps/mobile` | `.env` | `EXPO_PUBLIC_` for client-exposed vars |

Copy the `.env.example` in each app to get started:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

---

## Environment targets

### Local

- API: `http://localhost:3001`
- Stellar: `testnet`
- Database: local Postgres (see `apps/api/.env.example`)

### Preview / Hosted demo

Set the following in your hosting provider's environment settings:

**API**
```
NODE_ENV=production
PORT=3001
DATABASE_URL=<your-hosted-db-url>
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
SESSION_SECRET=<strong-random-secret>
```

**Web**
```
NEXT_PUBLIC_API_URL=https://<your-api-host>
NEXT_PUBLIC_APP_ENV=preview
```

**Mobile**
```
EXPO_PUBLIC_API_URL=https://<your-api-host>
EXPO_PUBLIC_APP_ENV=preview
```

### Production

Same as preview but:
- `STELLAR_NETWORK=mainnet`
- `STELLAR_HORIZON_URL=https://horizon.stellar.org`
- `NEXT_PUBLIC_APP_ENV=production` / `EXPO_PUBLIC_APP_ENV=production`

---

## Switching endpoints without code edits

All network calls in `apps/web` and `apps/mobile` read the API base URL from the environment variable at build time. To point at a different backend, update the env var and rebuild — no source changes needed.

---

## Running a consistent build

```bash
# Install dependencies
pnpm install

# Start API
cd apps/api && pnpm dev

# Start web
cd apps/web && pnpm dev

# Start mobile
cd apps/mobile && pnpm start
```

Ensure each app has its `.env` (or `.env.local`) populated before starting.
