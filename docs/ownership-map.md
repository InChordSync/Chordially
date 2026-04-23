# Ownership Map

This map defines the default review ownership for the active Chordially codebase. It is intentionally package-based so contributors know where to open changes and who should review them.

| Surface | Default owners | Scope |
| --- | --- | --- |
| `apps/api` | backend maintainers | API contracts, auth, realtime, payments, persistence, and operational middleware |
| `apps/web` | web maintainers | Public web, artist dashboard, admin dashboard, UI system, and server actions |
| `apps/mobile` | mobile maintainers | Expo app flows, native integrations, mobile navigation, and device behavior |
| `apps/contracts`, `packages/blockchain` | blockchain maintainers | Stellar integration, wallet helpers, contract experiments, and chain-facing safety rules |
| `packages/api-client`, `packages/types`, `packages/config` | platform maintainers | Shared contracts, shared tooling, and cross-package configuration |
| `docs`, `.github` | maintainers | Engineering docs, contribution guidance, CI, and release process |
| `history` | maintainers | Archive-only oversight to prevent accidental product coupling |

## Ownership Principles

- Shared-package changes should request review from every downstream surface they affect.
- Archive boundaries are owned by maintainers because accidental leakage from `history/` can destabilize the product.
- Contributor spike directories do not imply long-term ownership. Canonical package roots do.
- If a team surface grows materially, split ownership by subpath rather than relying on informal reviewer memory.
