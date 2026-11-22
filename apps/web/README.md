# @chordially/web

Next.js web app for the Chordially browser experience.

## Setup

From the repo root:

```bash
pnpm install
pnpm dev:web
```

Or from this directory:

```bash
pnpm install
pnpm dev
```

## Scripts

- `pnpm dev` - start Next.js dev server
- `pnpm build` - production build
- `pnpm start` - run production server
- `pnpm lint` - lint web app
- `pnpm typecheck` - TypeScript checks (`tsc -p tsconfig.json --noEmit`)
- `pnpm test` - run Vitest tests

## Environment

Copy `.env.example` to `.env.local` and set values as needed.

- `NEXT_PUBLIC_API_URL` - Chordially API base URL. Default fallback in client code is `http://localhost:4000` for auth requests and `https://api.chordially.local` for shared API client requests; set this explicitly for local/dev/prod consistency.

## Routes

- `/` - home page
- `/login` - sign in
- `/register` - account creation
- `/forgot-password` - password reset request (linked from login)
- `/profile/edit` - edit profile (authenticated flow)
- `/creators/[slug]` - public creator profile
- `/discover` - creator discovery/search

## Auth storage and CSRF assumptions

- Auth session is stored in browser `localStorage` under `chordially.token` and `chordially.user`.
- API requests include credentials (`credentials: "include"`) and can also send `Authorization: Bearer <token>` headers where applicable.
- State-changing requests include `X-Requested-With: XMLHttpRequest` to force CORS preflight; cookie-authenticated endpoints rely on SameSite/Strict cookie behavior and preflighted custom headers as CSRF mitigation.
- On `401` responses, web client clears stored auth and redirects to `/login?next=...` (except when already on auth routes).

## Directory layout

- `app/` - Next.js App Router pages/routes
- `components/` - shared UI components
- `lib/` - web client utilities (api/auth/creator/user clients, helpers)
- `__tests__/` - Vitest tests
