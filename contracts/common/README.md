# chordially-common

`no_std` money math shared by every Chordially contract: `bps_of`, `split_fee`, `distribute`.
Rounding is always down; dust goes to the designated recipient. See the crate docs in `src/lib.rs`.

## Reserved error-code ranges

| Range   | Owner         |
| ------- | ------------- |
| 1-99    | common        |
| 100-199 | Tip Jar       |
| 200-299 | splits        |
| 300-399 | campaigns     |
| 400-499 | subscriptions |

Each contract keeps its own `#[contracterror]` enum inside its range; the same ranges are exported
as `chordially_common::error_ranges`.

## Storage keys

Each contract defines a `#[contracttype] enum DataKey` for its own keys; keys are never shared
across contracts.
