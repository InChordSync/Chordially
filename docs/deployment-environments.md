# Deployment Environments

This document describes the three deployment tiers used by Chordially and how environment variables, secrets, and promotion gates differ between them.

## Environments Overview

### Development (Local)
Developers run the stack locally against their own config.

- **Trigger:** Manual (`npm run dev` / `pnpm dev`)
- **Approval gate:** None
- **Env var source:** `.env.local` file (not committed)
- **Secrets:** Managed locally by each developer
- **Purpose:** Day-to-day feature development and debugging

### Preview
Every pull request automatically receives an isolated preview deployment.

- **Trigger:** Automatic on every PR opened or updated
- **Approval gate:** None (auto-deployed)
- **Deployment platform:** Vercel (web/API) / EAS (mobile)
- **Env var source:** Preview secrets stored in Vercel/EAS project settings
- **Secrets:** Inherited from the `preview` secret group; production credentials are never used
- **Purpose:** Share a live link with reviewers; smoke-test before merge

### Production
The live environment serving real users.

- **Trigger:** Manual promotion from `main` after PR merge
- **Approval gate:** Required — a maintainer must approve the deployment in GitHub Environments before it proceeds
- **Deployment platform:** Vercel (web/API) / EAS (mobile)
- **Env var source:** Runtime injection via Vercel/EAS production environment variables
- **Secrets:** Stored in the `production` secret group; never exposed in logs or preview builds
- **Purpose:** Stable, user-facing releases

## Environment Variable Sources

| Variable Category | Development | Preview | Production |
|---|---|---|---|
| API base URL | `.env.local` | Vercel preview env | Vercel production env |
| Database connection | `.env.local` | Preview secret group | Production secret group |
| Auth secrets (JWT, OAuth) | `.env.local` | Preview secret group | Production secret group |
| Third-party API keys | `.env.local` | Preview secret group | Production secret group |
| Feature flags | `.env.local` | Preview secret group | Production secret group |

## Promotion Flow

```
Developer machine (dev)
        |
        | open PR
        v
Preview deployment (auto)
        |
        | PR approved & merged to main
        v
Production deployment (manual approval required)
```

## Notes

- Never copy production secrets into `.env.local` or preview environments.
- All secret rotation must be applied to the appropriate secret group in Vercel/EAS and updated in GitHub Actions secrets if referenced in CI workflows.
- Preview deployments are automatically torn down when the associated PR is closed.
