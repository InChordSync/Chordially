# Open-Source Onboarding Guide

Welcome to Chordially! This guide walks you through everything you need to go from forking the repo to getting your first PR merged.

---

## Getting Started

### 1. Fork the Repository

Click **Fork** on the [Chordially GitHub page](https://github.com/InChordSync/Chordially) to create your own copy under your account.

### 2. Clone Your Fork

```bash
git clone https://github.com/<your-username>/Chordially.git
cd Chordially
```

### 3. Add the Upstream Remote

```bash
git remote add upstream https://github.com/InChordSync/Chordially.git
```

### 4. Install Dependencies

```bash
npm install
```

Follow any additional setup steps in the project `README.md`.

---

## First Contribution

### Find a Good First Issue

Browse issues labelled [`good-first-issue`](https://github.com/InChordSync/Chordially/labels/good-first-issue). Comment on the issue to let maintainers know you are working on it.

### Branch Naming

Create a branch from the latest `main`:

```bash
git fetch upstream
git checkout -b feat/short-description upstream/main
```

Use these prefixes:
- `feat/` — new feature
- `fix/` — bug fix
- `docs/` — documentation update
- `chore/` — tooling or config change

### PR Checklist

Before opening a pull request, confirm:

- [ ] Code follows the project style guide
- [ ] All existing tests pass locally
- [ ] New behaviour is covered by tests where applicable
- [ ] Commit messages are clear and reference the issue (e.g. `fix: resolve audio sync bug closes #42`)
- [ ] PR description explains *what* changed and *why*

---

## Code Review Process

1. A maintainer will be assigned to review your PR within 3 business days.
2. Address all review comments with new commits — do not force-push after review starts.
3. Once approved, a maintainer will merge the PR using squash-and-merge.
4. Your changes will appear in the next release.

---

## Communication Channels

- **GitHub Issues** — bug reports, feature requests, and task tracking
- **GitHub Discussions** — general questions, ideas, and RFCs
- **Pull Request comments** — code-specific feedback during review

When in doubt, open an issue and ask. We are happy to help.
