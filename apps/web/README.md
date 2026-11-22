# @chordially/web

Next.js web app for Chordially.

## Directory layout

- `app/` - Next.js App Router pages and route handlers.
- `components/` - Shared React components used by app routes.
- `lib/` - Web client utilities (API/auth/creator/user clients, retries, logging, payment/wallet helpers).
- `__tests__/` - Vitest tests.

Prefer `lib/` for web utility modules and `components/` for shared UI components. The `@/*` TypeScript path alias resolves from `apps/web/*`.
