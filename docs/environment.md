# Environment Variables

Every app keeps a committed `.env.example` documenting the variables it
needs. Copy it to the file the app actually loads and fill in real values
for your environment. Never commit `.env`, `.env.local`, or any file
containing real secrets — only `.env.example` (and `apps/api/.env.test`,
which holds non-sensitive test-only values) are checked in.

## apps/api

Copy `apps/api/.env.example` to `apps/api/.env`:

| Variable         | Description                                                 |
| ---------------- | ----------------------------------------------------------- |
| `NODE_ENV`       | `development`, `test`, or `production`.                     |
| `PORT`           | Port the API server listens on (default `4000`).            |
| `DATABASE_URL`   | SQLite connection string for Prisma (e.g. `file:./dev.db`). |
| `JWT_SECRET`     | Secret used to sign authentication JWTs.                    |
| `JWT_EXPIRES_IN` | JWT expiry (e.g. `1h`).                                     |

`apps/api/.env.test` is committed with safe, test-only values and is used
automatically by the `test` script.

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
