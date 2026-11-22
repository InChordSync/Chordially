# Recurring support model (C-045)

Stellar has no native pull payments, so a subscription needs a deliberate design.

## Options compared

| Option | How it works | Pros | Cons / risks |
| --- | --- | --- | --- |
| **Token allowance + keeper pulls** (chosen) | The fan `approve`s the support contract for `period_amount * periods` until an expiration ledger; a keeper calls `charge(subscription_id)` once per period and the contract pulls with `transfer_from` | Fan keeps custody; revocable any time; amount and expiry bounded on-chain; works with SAC and SEP-41 tokens | Needs a keeper; a missed run delays a charge; allowance can be exhausted or expire; fan must keep balance |
| Claimable balances | The fan pre-funds one claimable balance per period | No allowance risk; native | Funds are locked up-front; many ledger entries; awkward cancellation (needs predicates and reclaim) |
| Off-chain reminders | Notify the fan to tip each period | No contract, no keeper | Not recurring; relies on the fan acting each time |

## Decision

Allowance + keeper. It is the only option that is non-custodial, cancellable by the fan at any
time, and truly automatic.

## Rules

- **Billing period:** fixed per subscription, in seconds (minimum one day). A charge is due when
  `now >= last_charged_at + period`; the keeper may charge each due period at most once.
- **Cancellation:** the fan cancels on-chain (`cancel`) or by revoking the allowance (`approve`
  with amount 0). Either stops all future charges immediately; nothing already paid is refunded.
- **Failure handling:** if a pull fails (insufficient balance or allowance), the contract records
  a failed attempt and emits an event. After `MAX_FAILED_ATTEMPTS` (default 3) consecutive
  failures the subscription is paused until the fan re-activates it. The keeper retries a failed
  charge on its next run, never more than once per run.
- **Keeper:** permissionless `charge` so anyone can run it; a reward for keepers is out of scope.

## Risk table

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Keeper offline | Charges delayed | Permissionless `charge`; catch-up limited to one due period per call |
| Allowance expires | Charges fail | Event + notification before the expiration ledger |
| Fan balance too low | Failed charge | Failure counter and pause; no partial charges |
| Malicious token | Fake balances, re-entrancy | Use the Tip Jar token allowlist (C-014) |
| Price changes | Fixed token amount drifts in fiat value | Amount is fixed per subscription; fans can re-subscribe |
