# Architecture

## Monorepo layout

Chordially is a pnpm + Turborepo workspace.

```txt
chordially/
├── apps/
│   ├── api/      @chordially/api    – Express modular monolith
│   ├── web/      @chordially/web    – Next.js web app
│   └── mobile/   @chordially/mobile – React Native / Expo app
│
├── packages/
│   ├── shared/   @chordially/shared – shared types and zod validation schemas
│   └── stellar/  @chordially/stellar – Stellar SDK / Horizon wallet client
│
├── .github/workflows/  – per-package CI
└── docs/                – this documentation
```

`packages/shared` is consumed directly from its TypeScript source (no build
step required) by both `apps/api` and `apps/web` via workspace dependencies.

## Backend: modular monolith

`apps/api` is an Express app organized as a **modular monolith**. Each domain
lives in its own module under `src/modules/<domain>/`, with a consistent
internal structure:

```txt
src/modules/<domain>/
├── controllers/   – request/response handling, calls into services
├── services/       – business logic
├── repositories/    – persistence (Prisma) – only where the module owns data
├── validators/      – request validation (zod schemas)
├── routes/           – Express routers
├── types/            – module-local types and DTOs
└── tests/            – module tests (vitest + supertest)
```

Cross-cutting concerns live under `src/shared/`:

```txt
src/shared/
├── config/      – environment loading and validation (zod)
├── database/     – Prisma client singleton
├── errors/        – AppError and other error types
├── logger/         – application logger
├── middleware/      – Express middleware (auth, error handling)
└── types/            – global type augmentations (e.g. Express Request)
```

### Current modules

- **`modules/auth`** – registration and login (`POST /api/auth/register`,
  `POST /api/auth/login`). Issues JWTs and validates credentials.
- **`modules/users`** – owns the `User` persistence layer (Prisma
  repository + service) that `modules/auth` depends on.
- **`modules/creators`** – creator profile persistence and routes
  (`POST /api/creators`, `GET /api/creators/:slug`, etc.).
- **`modules/fans`** – owns the fan profile persistence layer, consumed by
  `modules/users` (no dedicated routes of its own).
- **`modules/wallet`** – provisions a custodial Stellar wallet for every user
  at signup and exposes `GET /api/wallet/me`. See "Wallet: modules/wallet"
  below.
- **`modules/tips`** – idempotent fan-to-creator tipping (`POST /api/tips`).
  See "Tips: modules/tips" below.
- **`modules/streams`** – creator live sessions and the real-time tip feed
  (`POST /api/streams`, `POST /api/streams/:id/end`,
  `GET /api/streams/:id/tips`). See "Live tip feed: modules/streams" below.
- **`modules/reconciliation`** – the scheduled worker that recovers tips
  stuck in `submitted` (`POST /api/reconciliation/run` for manual/demo
  triggering). See "Observability, reconciliation & dead-letter recovery"
  below.

### Adding a new module

1. Create `src/modules/<domain>/` with the structure above (only add the
   subdirectories the module actually needs — e.g. a module with no
   persistence of its own can omit `repositories/`).
2. Define request/response types in `types/` and validation schemas in
   `validators/` (reuse `@chordially/shared` schemas where the same shape is
   used by the frontend).
3. Implement business logic in `services/`, calling into other modules'
   services (not their repositories) for cross-module data access.
4. Wire up `routes/` and mount the router in `src/app.ts`.
5. Add tests under `tests/` following the existing auth module tests as a
   template.

## Frontend: apps/web

`apps/web` is a Next.js (App Router) app. Routes that need authentication
state read from `AuthProvider` / `useAuth` (`lib/auth-context.tsx`), and API
calls go through `lib/auth-client.ts`. Form inputs are validated client-side
using the same zod schemas (`@chordially/shared`) that the API uses
server-side.

## Mobile: apps/mobile

`apps/mobile` is a React Native (Expo) + TypeScript foundation. The `src/`
directory is pre-structured for future feature work
(`components/`, `screens/`, `navigation/`, `hooks/`, `services/`, `utils/`,
`assets/`). `CreatorProfileScreen` and `ProfileImagePicker` exist as
early building blocks with their own tests, but are not yet mounted by
`App.tsx` — there is no navigation setup or authentication flow yet.

## Stellar: packages/stellar

`packages/stellar` wraps the Stellar SDK's Horizon client behind a
`StellarPaymentClient` interface (`HorizonStellarClient`). It exposes:

- `generateKeypair()` – local keypair generation, no network call.
- `getAccount()` / `getNativeBalance()` – reads account state and XLM
  balance from Horizon.
- `fundTestnetAccount()` – funds a new account via Friendbot (testnet only).
- `isAccountNotFoundError()` – lets callers distinguish "account not yet on
  the ledger" from other Horizon errors.
- `submitPayment()` – builds, signs, and submits a native XLM payment.
  Horizon's submit endpoint blocks until the transaction has been applied to
  a ledger, so a resolved promise means the payment is already confirmed —
  there's no separate async confirmation step to wire up for a simple
  single-signature payment like this.
- `isTransientSubmissionError()` – classifies a submission failure as
  retryable (network hiccups, stale sequence numbers) or permanent
  (insufficient balance, malformed transaction, etc).

Future payment/tipping features should build on this client rather than
calling the Stellar SDK directly, so wallet logic stays reusable and
isolated from module-specific business logic.

## Wallet: modules/wallet

Every user gets a custodial Stellar wallet created automatically during
`authService.register` (`apps/api/src/modules/auth/services/auth.service.ts`):

1. A keypair is generated via `@chordially/stellar`.
2. The secret key is envelope-encrypted
   (`modules/wallet/services/wallet-crypto.service.ts`): AWS KMS mints a
   one-time AES-256 data key, the secret is encrypted locally with it, and
   only the ciphertext plus the KMS-wrapped data key are persisted — the
   plaintext secret and plaintext data key never touch disk. Decrypting the
   secret always requires a round trip to KMS.
3. On testnet, the new account is funded via Friendbot. This is best-effort:
   a Friendbot outage is logged but does not fail signup, since it's a
   testnet convenience faucet rather than part of account custody.

`GET /api/wallet/me` (requires auth) returns the caller's `publicKey`,
`network`, and current native `balance` (read live from Horizon; an account
that isn't on the ledger yet reports a balance of `"0"` instead of erroring).

Relevant env vars (`apps/api/.env.example`): `AWS_KMS_KEY_ID`,
`STELLAR_NETWORK`, `STELLAR_HORIZON_URL`, `STELLAR_FRIENDBOT_URL`.

## Tips: modules/tips

`POST /api/tips` (requires auth) lets a fan tip a creator:

```json
{ "creatorId": "...", "amount": "25", "idempotencyKey": "<uuid>" }
```

A `Tip` row moves through a `pending → submitted → confirmed|failed` state
machine (`apps/api/src/modules/tips/services/tip.service.ts`):

1. **Idempotency** — `(fanUserId, idempotencyKey)` is a unique constraint. A
   duplicate request (same fan, same key) short-circuits to the existing
   `Tip`'s current result without touching Horizon again. Concurrent
   duplicate requests are handled too: if two requests race to insert the
   same key, the loser catches the resulting `P2002` unique-constraint error
   and returns the winner's row instead of submitting a second payment.
2. **Submission** — the fan's wallet secret is decrypted, and the payment is
   submitted via `@chordially/stellar`'s `submitPayment()`. Because Horizon's
   submit endpoint waits for ledger inclusion, a successful response already
   carries the confirmation (`txHash` + `confirmed` status) — no separate
   polling/streaming step is needed for this synchronous single-payment flow.
3. **Retry policy** — transient failures (`isTransientSubmissionError()`:
   stale sequence numbers, network-level Horizon errors) are retried up to 3
   attempts with exponential backoff. Permanent failures (insufficient
   balance, malformed transaction, etc) fail the tip immediately with
   `failureReason` set, no retry.

`POST /api/tips` responses always return `201` with the `Tip`'s current
`status`; a `"failed"` status is a normal, well-formed response, not an HTTP
error — the payment simply didn't succeed.

Tip requests accept an optional `streamId`; when present, it must belong to
the same creator being tipped, and the tip's state transitions are broadcast
live to that stream's feed (see below). Two abuse-protection rate limits
apply to every tip submission (`shared/rate-limit/rate-limiter.ts`, wired up
in `modules/tips/controllers/tip.controller.ts`): a per-fan limit and, when a
`streamId` is given, a per-stream limit. Both are in-memory fixed-window
limiters, configurable via `TIP_RATE_LIMIT_WINDOW_MS`,
`TIP_RATE_LIMIT_PER_FAN`, and `TIP_RATE_LIMIT_PER_STREAM`; exceeding either
returns `429`.

## Live tip feed: modules/streams

A `Stream` represents one of a creator's live sessions. A creator starts one
with `POST /api/streams` and ends it with `POST /api/streams/:id/end`; fans
tip into it by including the stream's id as `streamId` on `POST /api/tips`.

`GET /api/streams/:id/tips` is a Server-Sent Events feed (chosen over
WebSockets since this is a one-directional broadcast — server to viewers —
with no need for the client to send anything back over the same
connection). On connect it:

1. Replays a **backlog**: every tip already associated with the stream, each
   at its _current_ status only (`modules/tips/repositories/tip.repository.ts`'s
   `findByStreamId`). A tip that has already reached `confirmed` is replayed
   once as `confirmed`, not once per intermediate state it passed through —
   so late joiners can't see duplicate/stale events for the same tip.
2. Subscribes to `shared/realtime/tip-event-bus.ts`, an in-process pub/sub
   keyed by `streamId`. `modules/tips/services/tip.service.ts` publishes an
   event on every state transition (`pending` on creation, `submitted` right
   before the Horizon call, then `confirmed`/`failed`). This is what gives
   fans and creators the fast "Tip Incoming" → "Confirmed"/"Failed"
   experience without waiting for the full tip to round-trip: the same
   `tipId` shows up multiple times as its status changes, and the client
   reconciles by `tipId` rather than appending a new row each time.

Ordering and duplicate-prevention: every published event carries a
process-wide monotonically increasing `seq` (sent as the SSE `id:` field),
so events for a given stream are strictly ordered and a reconnecting client
could in principle resume with `Last-Event-ID` (not implemented, since the
backlog replay already covers a fresh reconnect).

The event bus and rate limiters are both plain in-memory state, which is
enough for a single API instance; a multi-instance deployment would need to
swap the event bus for something like Redis pub/sub and the rate limiters
for a shared store, without changing any of the calling code.

## Split payments: modules/streams

A stream that involves multiple performers can configure a payout split so
every tip made to it is divided automatically. The full tradeoff analysis
(atomic multi-operation transaction vs. a collection-wallet-and-scheduled-payout
model, and why the former was chosen) lives in
[`docs/split-payments-design.md`](./split-payments-design.md); this section
just summarizes where the pieces live.

- `PUT /api/streams/:id/payout-config` (host-only) sets a `StreamPayoutConfig`
  — a list of `{ creatorId, percentage }` payees whose percentages must sum
  to 100 (`modules/streams/services/stream-payout-config.service.ts`).
  `GET /api/streams/:id/payout-config` reads it back.
- When `POST /api/tips` is submitted with a `streamId` that has a payout
  config, `tip.service.ts` computes each payee's share
  (`modules/streams/services/payout-split.util.ts` — rounds to Stellar's
  7-decimal precision and hands any rounding remainder to the first payee so
  shares always sum exactly to the tip amount), snapshots them into one
  `TipPayout` row per payee, and submits a single Stellar transaction with
  one `Payment` operation per payee (`@chordially/stellar`'s
  `submitSplitPayment()`) instead of the single-recipient `submitPayment()`.
- Because it's one atomic transaction, every `TipPayout` row for a tip always
  shares the same status and `txHash` as the parent `Tip` — they move
  through `pending → submitted → confirmed|failed` together. The per-row
  state exists for bookkeeping and display (including the live feed showing
  each creator's share), not because payees can settle independently.
- The live feed (`GET /api/streams/:id/tips`) includes a `payouts` array on
  every event and backlog entry for a split tip, so viewers see each
  creator's individual share update in lockstep with the overall tip status.

## Observability, reconciliation & dead-letter recovery: modules/reconciliation & modules/tips

Every tip submission is synchronous (see "Tips: modules/tips" above), so in
the normal case a tip never sits in an intermediate state for long. The gap
this section closes: a worker process crash (or losing the Horizon response)
between submitting a transaction and writing "confirmed" locally, which
would otherwise leave a `Tip` stuck in `submitted` forever with no
indication of whether the money actually moved.

### Reconciliation worker

`modules/reconciliation/services/reconciliation.service.ts` runs on an
interval (`RECONCILIATION_INTERVAL_MS`, started from `server.ts`, or
triggered manually via `POST /api/reconciliation/run`):

1. Finds tips stuck in `submitted` for longer than
   `RECONCILIATION_STUCK_THRESHOLD_MS` (`tipRepository.findStuckSubmitted`).
2. For each, resolves the expected destination(s) — the single creator, or
   every payee for a split tip — and calls `@chordially/stellar`'s
   `listSentPayments()` to read the fan's actual outgoing payments from
   Horizon since just before the tip got stuck.
3. If every expected destination has a matching successful payment sharing
   the same transaction hash, the tip (and all its payouts, for a split) are
   confirmed with that hash — recovering exactly the "money moved, but we
   never found out" case. A split tip is only confirmed when _all_ payees
   match the same hash, since the underlying transaction is atomic; a
   partial match can't happen for a transaction that actually succeeded.
4. If nothing matches after `RECONCILIATION_DEAD_LETTER_THRESHOLD_MS`, the
   tip is dead-lettered (see below). Otherwise it's left alone for the next
   run.

### Dead-letter recovery

A tip reconciliation gives up on (or a normal submission permanently fails)
ends up `failed` with a `failureReason` — that's the dead letter. Fans can
inspect and safely retry it:

- `GET /api/tips/:id` — the tip's current state and failure reason.
- `POST /api/tips/:id/retry` — only valid when the tip is `failed`. This
  creates a **brand-new** `Tip` with a fresh idempotency key (never
  resubmits the original), copying the creator/amount/stream from the
  original. The new tip's `retriedFromTipId` points back at the original, so
  the failure history stays visible, while the original row is left
  untouched as the permanent record of what happened.

### Observability

`shared/metrics/metrics.ts` is a small in-memory counters + latency
histogram registry (not a full Prometheus client — swapping in a real
backend later would only mean changing this one module), read via
`GET /api/metrics`:

- `tip_submission_latency_ms` / `tip_confirmation_latency_ms` — histograms,
  recorded in `tip.service.ts` at the end of every submission attempt loop
  and on every confirmation, respectively.
- `tip_retry_total`, `tip_confirmed_total`, `tip_failed_total` — counters.
- `reconciliation_runs_total`, `reconciliation_scanned_total`,
  `reconciliation_repaired_total`, `reconciliation_deadlettered_total` —
  counters, incremented once per reconciliation run.

Failure rate is derived from the counters (`tip_failed_total /
(tip_confirmed_total + tip_failed_total)`) rather than tracked as its own
metric, since it's a pure function of the other two.

Structured JSON logs (`shared/logger/logger.ts`) are emitted for every tip
finalization, every submission attempt failure, and every reconciliation run
and per-tip outcome — each with the relevant `tipId`, status, attempt count,
etc. as structured fields rather than interpolated into the message string.

### End-to-end demo

[`docs/demo-e2e.md`](./demo-e2e.md) documents `pnpm test:e2e:testnet`
(`apps/api/e2e/`): a real-Stellar-Testnet run of signup → wallet
provisioning → live tip → split payment → independently-verified ledger
confirmation → reconciliation of a manufactured stuck payment. It's excluded
from the normal `pnpm test` run (needs network access and real ledger-close
time) but exercises the real `HorizonStellarClient` end to end rather than
the mocked one every other test uses.

## Contracts

- [Tip Jar contract design](./tipjar-contract-design.md)
- [Contract tooling](./contracts-tooling.md)
