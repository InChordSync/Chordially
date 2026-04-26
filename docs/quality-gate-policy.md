# Pull Request Quality Gate Policy

This document defines the mandatory checks every pull request must pass before it is eligible for merge. All contributors and reviewers are expected to follow this policy.

## Required Checks

### 1. CI Pipeline Must Pass
All automated CI checks (lint, typecheck, tests) must complete successfully. A red check blocks the merge.

### 2. Minimum One Reviewer Approval
At least one team member must review and approve the PR. The author cannot approve their own PR.

### 3. No Merge Conflicts
The branch must be up-to-date with `main` and must not have any unresolved merge conflicts at the time of merge.

### 4. Test Coverage Must Not Decrease
The overall test coverage percentage must be equal to or greater than the coverage on `main`. PRs that drop coverage will be flagged and require justification.

### 5. No New Linting Errors
The PR must not introduce any new ESLint or TypeScript linting errors. Existing suppressions must not be widened.

### 6. Conventional Commit Format Required
All commits in the PR must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification, for example:

```
feat(auth): add OAuth2 login support
fix(player): resolve audio desync on seek
docs(readme): update setup instructions
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`.

## Merge Procedure

1. Author opens PR with a clear description and links any related issues.
2. CI runs automatically; the author resolves any failures.
3. At least one reviewer approves.
4. Author (or maintainer) merges using **Squash and Merge** to keep a clean history.

## Exemptions

Exemptions require explicit sign-off from a maintainer and must be documented in the PR description.
