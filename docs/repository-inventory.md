# Repository Inventory

This document is the source of truth for which parts of the repository are active, which parts are experimental, and which parts should not be used as implementation targets for new feature work.

## Active Product Surface

These paths are the maintained foundation for Chordially:

| Path | Status | Purpose |
| --- | --- | --- |
| `apps/api` | active | Express API and backend service composition |
| `apps/web` | active | Next.js web application |
| `apps/mobile` | active | Expo React Native application |
| `apps/contracts` | active | Stellar contract workspace and contract experiments that are part of the current product direction |
| `packages/api-client` | active | Shared API client helpers |
| `packages/blockchain` | active | Shared blockchain utilities |
| `packages/config` | active | Shared lint and TypeScript configuration |
| `packages/types` | active | Shared domain contracts and API types |
| `docs` | active | Product, architecture, deployment, and contributor documentation |
| `.github` | active | CI and repository automation |

## Legacy and Experimental Surface

These paths are intentionally retained for reference only and must not be used as the base for new feature work:

| Path | Status | Rationale |
| --- | --- | --- |
| `history` | archive-only | Prior implementation experiments, feature spikes, abandoned routes, and UI studies |
| `apps/api/prisma` | prototype | Useful for reference during model design, but not yet the authoritative long-term MongoDB plan |
| `apps/web/devwums`, `apps/web/wumibals` | experimental | Individual contributor spike directories that should be folded into stable app routes before reuse |
| `apps/mobile/abdulmujib`, `apps/mobile/bellabuks`, `apps/mobile/leothosine` | experimental | Contributor-owned mobile spikes that need consolidation before shipping |
| `apps/api/devwums`, `apps/api/wumibals`, `apps/api/abdulmujib` | experimental | Temporary backend spike directories pending consolidation into the module layout |

## Decision Rules

- New work should target the active package roots, not ad hoc contributor subdirectories.
- Anything under `history/` is reference material only and should never be imported directly into production paths without review and refactoring.
- If an experimental directory becomes canonical, migrate it into the stable package structure and remove the temporary subdirectory.
- Duplicate lockfiles should be treated as temporary until package-management policy is finalized. The root workspace lockfile remains the primary source of truth.

## Immediate Cleanup Targets

- Consolidate package-level spike directories into stable module and route locations.
- Replace malformed or prototype-only schema definitions with one authoritative data-model source.
- Keep the ignored local issue-planning helpers untracked so operational execution artifacts do not leak into the repo.
