# Archive Boundary

The `history/` directory is preserved as a read-only archive of past implementation attempts, spikes, and discarded experiments. It exists to provide reference context, not a reusable code surface.

## Archive Rules

- Do not import code from `history/` directly into runtime packages.
- If a historical artifact is worth reviving, re-implement it inside the active package structure and add tests rather than moving the file wholesale.
- Keep all new experimental work out of `history/`. Use short-lived feature branches or package-local spike directories that can be reviewed and consolidated quickly.
- Treat filenames in `history/` as historical breadcrumbs. They are not stable APIs, modules, or ownership indicators.

## Contributor Guidance

- Build new backend work in `apps/api/src`.
- Build new web work in `apps/web/app`, `apps/web/components`, and `apps/web/lib`.
- Build new mobile work in `apps/mobile` under the canonical app structure.
- Use shared contracts from `packages/*` rather than copying types from archived files.

## Review Expectations

- Pull requests that revive ideas from `history/` should reference the archived file in the PR description and explain what was rewritten versus copied.
- Reviewers should reject changes that treat archived files as production-ready building blocks.
