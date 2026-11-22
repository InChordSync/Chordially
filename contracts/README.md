# Contracts

Soroban contracts workspace. See [docs/contracts-setup.md](../docs/contracts-setup.md) for
toolchain setup and `pnpm --filter @chordially/contracts doctor` to verify it.

## Prerequisites

- [Rust](https://rustup.rs/) (pinned via `rust-toolchain.toml`)
- WASM target: `wasm32v1-none` (installed automatically from the toolchain file)
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) for building/deploying contracts

## Directory layout

```
contracts/
  Cargo.toml        # workspace manifest (resolver = "2", [workspace.dependencies])
  README.md
  hello/            # placeholder crate (deleted when the first real contract lands)
    Cargo.toml
    src/lib.rs
  common/           # shared crate
```

## Commands

From `contracts/`:

```bash
# Run tests for the workspace
cargo test

# Build WASM artifact for a crate (release)
cargo build --target wasm32v1-none --release -p hello
# or using Stellar CLI
stellar contract build
```

Generated `.wasm` files are placed under `target/` and should not be committed. The root `.gitignore` ignores `contracts/target/`, `**/target/`, and `*.wasm`.

## Notes

- Cargo cannot be integrated into the pnpm/Turborepo workspace; `contracts/` is a separate Cargo workspace at the repo root.
- Integration with Turborepo happens separately (C-002).
- `soroban-sdk` is declared once in `[workspace.dependencies]`; member crates must use `workspace = true`.
- Release profile is tuned for WASM size: `opt-level = "z"`, `lto = true`, `panic = "abort"`, `overflow-checks = true`.
