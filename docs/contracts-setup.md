# Contracts setup

Soroban tooling moves quickly, so toolchain versions are pinned:

- Rust channel and WASM target: `contracts/rust-toolchain.toml`
- Stellar CLI version: `contracts/STELLAR_CLI_VERSION` (the only place it is declared)

## 1. Install Rust

Install [rustup](https://rustup.rs) (macOS and Linux). The pinned toolchain, `wasm32v1-none`
target, `rustfmt` and `clippy` install themselves on the first `cargo` call inside `contracts/`.

## 2. Install the Stellar CLI

```bash
cargo install --locked stellar-cli --version "$(cat contracts/STELLAR_CLI_VERSION)"
```

On macOS you can use Homebrew (`brew install stellar-cli`) if it matches the pinned version.

## 3. Create a testnet identity

```bash
stellar keys generate dev --network testnet --fund
```

## 4. Build, test and deploy

```bash
pnpm --filter @chordially/contracts test
pnpm --filter @chordially/contracts build
stellar contract deploy --wasm contracts/tipjar/target/wasm32v1-none/release/tipjar.wasm \
  --source dev --network testnet
```

## 5. Verify your environment

```bash
pnpm --filter @chordially/contracts doctor
```

It prints a pass/fail table with the exact fix command for each failure.

## Troubleshooting

- **Wrong target:** `rustup target add wasm32v1-none`.
- **Missing `wasm-opt`:** install binaryen (`brew install binaryen`, or `apt install binaryen`).
- **Friendbot rate limits:** wait a minute and retry `--fund`, or fund from another identity.

## Security

Testnet keys only. Never reuse a mainnet key locally.

## Tasks and lint

`pnpm turbo run build|test|lint --filter=@chordially/contracts` delegates to Cargo. Without Rust
installed the tasks print an install hint and exit 0; with `CI=true` they fail instead.
Style and safety lints live in `contracts/Cargo.toml` (`[workspace.lints.clippy]`),
`contracts/rustfmt.toml` and `contracts/deny.toml` (`cargo deny check`).
