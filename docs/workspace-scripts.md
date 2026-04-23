# Workspace Scripts

Chordially uses a small shared script vocabulary across packages so contributors can move between surfaces without relearning basic commands.

## Standard Script Names

| Script | Meaning |
| --- | --- |
| `dev` | Start the primary local development process for the package |
| `build` | Build production artifacts or compile output where applicable |
| `lint` | Run the package's static quality checks |
| `typecheck` | Run TypeScript type validation for the package |
| `test` | Run the package's automated test suite or a documented no-op placeholder |
| `check:env` | Validate required environment variables for runnable applications |

## Current Policy

- Application packages should expose `dev`, `build`, `lint`, `typecheck`, and `test`.
- Shared packages should expose `build` when they emit artifacts and should add at least `lint` and `typecheck` placeholders if deeper checks are not wired yet.
- No-op placeholders are acceptable temporarily, but they must clearly state the missing capability.
- Root scripts should orchestrate workspace-wide tasks without hiding which package command is being run.

## Notes

- `apps/api` now exposes `check:env` because its README already depends on it.
- Package scripts should prefer local package checks over cross-package commands to keep failures scoped and understandable.
