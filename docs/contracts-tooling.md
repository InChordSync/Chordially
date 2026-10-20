# Contract tooling

## Local network

`pnpm contracts:local:up` starts `stellar/quickstart` in standalone mode via
`docker-compose.stellar.yml` and waits until Horizon and Soroban RPC are ready (timeout from
`LOCAL_NETWORK_TIMEOUT_MS`, default 180000). `pnpm contracts:local:reset` wipes state and restarts.
`pnpm contracts:local:deploy` builds and deploys every contract, writing ids to
`contracts/deployments/local.json` (gitignored) and `.env.local`. Variables are listed in
[environment.md](./environment.md). Docker needs about 4 GB of memory.

## TypeScript bindings

`pnpm contracts:bindings` runs `stellar contract bindings typescript` for every contract into
`packages/stellar/src/contracts/<name>/` and exports them from `src/contracts/index.ts`.

**Decision: generated bindings are committed.** TypeScript-only contributors can then build the
repo without Rust, and binding diffs make interface changes visible in review. A CI check that
regeneration produces no diff will follow. `packages/stellar/src/contracts/**` is excluded from
ESLint instead of editing generated output.

## WASM size budget

`pnpm contracts:size` builds and optimises each contract, prints a table and exits non-zero when an
optimised WASM exceeds its budget in `contracts/size-budget.json` (`default`, plus `overrides` by
contract name with the reason recorded in `notes`).
