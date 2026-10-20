# Tip Jar contract design

Status: accepted. Reviewers: two contributors (see the pull request).

## Context

Tips are currently plain Horizon payments with a memo. A contract adds structured metadata, fee
rules enforced on-chain and events the indexer can consume, at the cost of more audit surface.

## Requirements and why a contract beats payment + memo

| Requirement                                | Payment + memo                              | Tip Jar contract                                               | Entry point                        |
| ------------------------------------------ | ------------------------------------------- | -------------------------------------------------------------- | ---------------------------------- |
| Platform fee taken atomically with the tip | Two operations the client can omit or alter | Fee computed and transferred inside one invocation             | `tip`, `quote_fee`                 |
| Fee changes controlled by an admin         | Off-chain policy only                       | Admin-gated, bounded (max 1,000 bps)                           | `set_fee_bps`, `set_fee_recipient` |
| Structured, verifiable metadata            | 28-byte text memo                           | Memo up to 64 bytes, hash emitted in the event                 | `tip`                              |
| Indexer-friendly events                    | Parse payment operations                    | Typed `tip` event with from, creator, token, amount, memo hash | `tip`                              |
| Emergency stop                             | None                                        | Pause flag checked on every tip                                | `pause`, `unpause`, `is_paused`    |
| Safe admin handover                        | None                                        | Two-step transfer                                              | `propose_admin`, `accept_admin`    |
| Pay in any Stellar asset contract          | Per-asset payment ops                       | Any SEP-41 token address                                       | `tip`                              |

Rejected for this contract: escrowed or delayed payouts, per-tip refunds and split payouts. Splits
and campaigns have their own designs.

## Entry points

`init(admin, fee_recipient, fee_bps)`, `tip(from, creator, token, amount, memo)`, `quote_fee(amount)`,
`set_fee_bps`, `set_fee_recipient`, `propose_admin`, `accept_admin`, `pause`, `unpause`,
`is_paused`, `admin`.

## Storage layout

Instance storage only: `Admin`, `PendingAdmin`, `Paused`, `FeeBps`, `FeeRecipient`. No per-tip
records; history lives in events.

## Events

| Topic                  | Data                      |
| ---------------------- | ------------------------- |
| `tip`, from, creator   | token, amount, memo hash  |
| `fee_bps`              | new fee in bps            |
| `fee_rcpt`             | new fee recipient         |
| `adm_prop` / `adm_acc` | proposed / accepted admin |
| `paused`               | `true` / `false`          |

## Failure modes

| Error                | Code | Cause                             |
| -------------------- | ---- | --------------------------------- |
| `AlreadyInitialized` | 1    | `init` called twice               |
| `NotInitialized`     | 2    | Any call before `init`            |
| `InvalidAmount`      | 3    | `amount <= 0` or fee overflow     |
| `MemoTooLong`        | 4    | Memo over 64 bytes                |
| `Paused`             | 5    | Tipping while paused              |
| `FeeTooHigh`         | 6    | Fee above 1,000 bps               |
| `NoPendingAdmin`     | 7    | `accept_admin` without a proposal |

Token transfer failures (insufficient balance, missing trustline) abort the whole invocation, so
a tip is either fully applied or not at all.

## Custody decision

**Pass-through.** The contract never holds funds: `tip` transfers directly from the tipper to the
creator and fee recipient inside the same call. This keeps the audit surface small and means a
contract bug cannot strand balances. Escrow is rejected until a feature (such as campaigns)
requires it.

Rounding: the fee is rounded down, so the creator always receives the remainder and the fee can
never exceed its stated percentage.
