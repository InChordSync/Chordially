# Contributing to Chordially

Chordially is being developed as a production-grade open-source product. Contributors should favor small, reviewable changes that preserve a stable path toward live tipping, realtime interactivity, and operational safety.

## Branch Conventions

- Feature work: `feat/<short-description>`
- Fixes: `fix/<short-description>`
- Docs-only changes: `docs/<short-description>`
- Chore or tooling changes: `chore/<short-description>`

Use short, descriptive names such as `feat/live-session-state` or `docs/release-process`.

## Commit Conventions

- Keep commits small and logically scoped.
- Prefer imperative messages:
  - `add local bootstrap script`
  - `document release process`
  - `normalize package env examples`
- Do not mix unrelated refactors into the same commit.

## Pull Request Expectations

- Link the issue or roadmap item being addressed.
- Describe the user-facing or operator-facing impact.
- Include validation notes covering automated checks and any manual verification.
- Call out follow-up work explicitly instead of expanding scope silently.

Use the repository pull request template when opening a PR.

## Labels and Issue Flow

Recommended labels:

- `foundation`
- `backend`
- `web`
- `mobile`
- `blockchain`
- `docs`
- `infra`
- `security`
- `needs-design`
- `good first issue`

Recommended issue states:

- `todo`
- `in-progress`
- `blocked`
- `review-ready`
- `done`

Track these with GitHub Projects, labels, or milestones rather than relying on issue title edits.

## Release Expectations

- `main` should stay releasable.
- Changes should merge through pull requests, not direct pushes.
- Group release notes by product surface: API, web, mobile, blockchain, docs, infra.
- Note any environment variable, migration, or operational changes in the PR description.

See [docs/release-process.md](./docs/release-process.md) for the release workflow and [docs/environment-registry.md](./docs/environment-registry.md) for environment ownership.
