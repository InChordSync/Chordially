# Chordially

**Chordially** is a music and fan engagement platform that helps creators connect with their audience through digital experiences, community-driven interactions, and Stellar-powered payment flows.

The project brings together a web app, mobile app, backend API, and dedicated Stellar service in a single TypeScript monorepo. The goal is to create a reliable foundation for building creator profiles, fan experiences, wallet-enabled interactions, and payment features across both web and mobile.

Chordially is designed for the modern creator economy, where artists, musicians, and creators need more direct ways to engage their fans, receive support, and build stronger digital communities.

---

## What Chordially Does

Chordially focuses on the relationship between creators and fans.

Creators can use the platform to build their presence, manage their profile, and create engagement opportunities for their audience. Fans can discover creators, interact with them, support them, and participate in experiences that go beyond passive listening or following.

The Stellar integration allows the platform to support fast, low-cost payment primitives that can later power features such as:

- fan-to-creator payments,
- creator support,
- digital rewards,
- wallet-based interactions,
- payment confirmations,
- on-chain transaction tracking,
- creator monetization flows.

The project is structured to support both early MVP development and future expansion into richer creator and fan experiences.

---

## Core Product Areas

### Creator Experience

Creators are the main users who build and manage their public presence on Chordially.

The creator experience may include:

- creator profile setup,
- creator bio and public details,
- music or content-related profile information,
- fan engagement tools,
- payment or support options,
- activity history,
- creator dashboard features.

The platform is intended to give creators a direct channel to connect with fans without relying only on traditional social media platforms.

---

### Fan Experience

Fans can use Chordially to discover creators, follow their activity, and engage with them through interactive experiences.

The fan experience may include:

- browsing creator profiles,
- engaging with creator content,
- supporting creators through Stellar-powered payments,
- viewing interaction or payment history,
- participating in creator-led campaigns,
- accessing mobile-first engagement flows.

The mobile app is especially important for fan interactions because many fan engagement flows are expected to happen quickly, casually, and on the go.

---

### Stellar Payment Layer

Chordially includes a dedicated Stellar service to keep blockchain-related operations separate from the main application logic.

This service is responsible for handling Stellar-specific workflows such as:

- wallet-related operations,
- transaction preparation,
- transaction submission,
- payment status checks,
- Horizon API communication,
- Stellar network configuration,
- payment and wallet abstractions used by the rest of the platform.

By isolating Stellar logic into its own service, the project remains easier to maintain and safer to extend as the payment layer grows.

---

## Tech Stack

Chordially is built with a modern full-stack TypeScript setup.

| Area               | Technology                             |
| ------------------ | -------------------------------------- |
| Web App            | React / Next.js                        |
| Mobile App         | React Native / Expo                    |
| Backend API        | Express.js                             |
| Blockchain Service | Stellar                                |
| Language           | TypeScript                             |
| Package Manager    | pnpm                                   |
| Architecture       | Monorepo                               |
| Shared Code        | Internal packages for config and types |

---

## Repository Structure

```txt
chordially/
├── apps/
│   ├── api/        # @chordially/api    – Express modular monolith (auth)
│   ├── web/        # @chordially/web    – Next.js web app (login/register)
│   └── mobile/     # @chordially/mobile – React Native / Expo foundation
│
├── packages/
│   ├── shared/     # @chordially/shared – shared types & validation schemas
│   └── stellar/    # @chordially/stellar – Stellar integration scaffold
│
├── docs/           # architecture, environment, testing, contributing
├── .github/workflows/  # per-package CI
└── README.md
```

See [docs/architecture.md](./docs/architecture.md) for more detail on how
these pieces fit together.

---

## Applications

### `apps/api`

The API app is the main backend service for Chordially, built as an Express
**modular monolith** (see [docs/architecture.md](./docs/architecture.md)).

**Currently implemented:**

- `modules/auth` — `POST /api/auth/register` and `POST /api/auth/login`,
  backed by Prisma + SQLite, password hashing (bcrypt), and JWT issuance.
- `modules/users` — owns the `User` persistence layer used by `modules/auth`.
- `shared/middleware/auth.middleware.ts` — JWT bearer verification
  (`requireAuth`), ready for future authenticated routes.

**Future direction** (see Core Product Areas above): user/creator/fan profile
APIs, payment request coordination with `packages/stellar`, and additional
modules following the same convention.

---

### `apps/web`

The web app provides the browser-based Chordially experience, built with
Next.js (App Router).

**Currently implemented:**

- `/login` and `/register` pages with client-side validation using
  `@chordially/shared`'s zod schemas.
- `AuthProvider` / `useAuth` context for session state (token + user stored
  in `localStorage`).
- A minimal home page reflecting authenticated vs. unauthenticated state.

**Future direction:** creator onboarding, dashboards, profile management,
account settings, and wallet/payment UI.

---

### `apps/mobile`

The mobile app is a React Native (Expo) + TypeScript foundation for the
Chordially mobile experience.

**Currently implemented:**

- Project tooling (Expo, TypeScript, ESLint, Jest via `jest-expo`).
- A pre-structured `src/{components,screens,navigation,hooks,services,utils,assets}`
  layout for future feature work.
- No authentication or screens yet — see Core Product Areas above for the
  intended fan/creator mobile experience.

---

## Shared Packages

### `packages/shared`

Shared TypeScript types and zod validation schemas used by both `apps/api`
and `apps/web`, so request/response shapes and validation rules (e.g.
`registerSchema`, `loginSchema`, `AuthUser`, `AuthResponse`) stay in sync
across the stack.

---

### `packages/stellar`

A compile-only scaffold for the future Stellar payment layer described in
the Core Product Areas section above. It currently exports placeholder types
and interfaces only — no blockchain or Horizon integration has been
implemented yet.

---

## Getting Started

### Prerequisites

Before running the project, make sure you have the following installed:

- Node.js
- pnpm
- Git
- Expo tooling for mobile development

---

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/chordially.git
cd chordially
```

Install dependencies:

```bash
pnpm install
```

---

## Running the Apps

Copy the `.env.example` file for each app you want to run (see
[Environment Variables](#environment-variables) below) before starting it.

Start the API service:

```bash
pnpm dev:api
```

Start the web app:

```bash
pnpm dev:web
```

Start the mobile app:

```bash
pnpm dev:mobile
```

For local development, each app should usually run in its own terminal window.

---

## Environment Variables

Each app has a committed `.env.example` describing the variables it needs.
Copy it to the file the app loads locally and fill in real values:

```txt
apps/api/.env          # from apps/api/.env.example
apps/web/.env.local    # from apps/web/.env.example
apps/mobile/.env       # from apps/mobile/.env.example
```

See [docs/environment.md](./docs/environment.md) for the full list of
variables per app.

Do not commit real secrets, private keys, or production credentials — only
`.env.example` files (and `apps/api/.env.test`, which holds non-sensitive
test-only values) are checked in.

---

## Product Direction

Chordially is being built around a simple idea:

> Creators should have a more direct, flexible, and rewarding way to connect with their fans.

The early product foundation is focused on:

1. User authentication.
2. Creator and fan profiles.
3. Shared web and mobile user flows.
4. Stellar-powered payment primitives.
5. Creator support and fan engagement features.
6. Reliable backend APIs.
7. Clean separation between product logic and blockchain logic.

As the project grows, Chordially can expand into more advanced experiences such as campaigns, creator communities, digital rewards, exclusive fan interactions, and richer wallet-based features.

---

## Example User Flow

A typical Chordially flow may look like this:

1. A creator creates an account.
2. The creator sets up their public profile.
3. A fan discovers or visits the creator profile.
4. The fan chooses to support or interact with the creator.
5. The platform prepares a Stellar-powered payment or engagement action.
6. The Stellar service handles the transaction workflow.
7. The API records the result and updates the relevant user activity.
8. The creator and fan can both view the completed interaction.

This flow allows Chordially to combine familiar creator platform behavior with blockchain-powered payments behind the scenes.

---

## Development Guidelines

When working on Chordially, keep the codebase clear, typed, and maintainable.

Recommended principles:

- Keep product logic readable and easy to follow.
- Use shared types where data crosses app boundaries.
- Keep Stellar-specific logic inside `packages/stellar`.
- Avoid duplicating API contracts across apps.
- Keep web and mobile flows aligned where possible.
- Prefer small, focused changes.
- Document important setup or architecture decisions.
- Do not commit secrets or private keys.

---

## Scripts

Common development commands:

```bash
pnpm install
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
```

Workspace-wide checks (also run per-package in CI, see
[docs/testing.md](./docs/testing.md)):

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check    # lint + typecheck + test
```

See [docs/contributing.md](./docs/contributing.md) for the recommended
development workflow.

---

## Current Status

Chordially is currently in active development.

The current focus is on establishing the core application structure, authentication foundation, shared types, and the Stellar package scaffold. Once the base flows are stable, the project can expand into deeper creator and fan engagement features.

---

## License

License information should be added before public release.
