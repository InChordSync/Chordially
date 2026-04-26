# Secrets Management

This document establishes conventions for storing and accessing secrets across all environments in the Chordially platform.

## Local Development

- Use `.env` files at the project or package root to hold secrets and environment-specific configuration.
- **Never commit `.env` files.** Ensure `.env` is listed in `.gitignore` at every level where it may appear.
- Maintain a `.env.example` file alongside each `.env` file. The example file must list every required key with placeholder values and a brief comment explaining each one. It is safe to commit `.env.example`.
- Developers clone the repo, copy `.env.example` to `.env`, and fill in real values obtained from a secure shared channel (e.g., 1Password team vault or a designated Slack DM with the team lead).
- Never hard-code secrets in source files. If a secret is needed at build time, load it through `process.env` and document it in `.env.example`.

## Continuous Integration (GitHub Actions)

- All secrets used in CI pipelines must be stored as **GitHub Actions Secrets** at the repository or organization level.
- Access secrets in workflow files with `${{ secrets.SECRET_NAME }}`. Do not echo or log secret values.
- Use **environment-scoped variables** (Settings → Environments → Secrets) to separate staging and production values. Name environments consistently: `staging`, `production`.
- Rotate CI secrets whenever a team member with access leaves the project or when a potential exposure is detected.
- Avoid storing secrets in workflow YAML files or in environment variables that are printed in build logs.

## Production

- Production secrets must be stored in a dedicated secrets manager. Approved options:
  - **HashiCorp Vault** — preferred for self-hosted or hybrid deployments.
  - **AWS Secrets Manager** — preferred when the deployment target is AWS infrastructure.
- Applications retrieve secrets at startup via the secrets manager SDK or a sidecar agent. Secrets are injected into the process environment and never written to disk.
- Access to the secrets manager is controlled via IAM roles or Vault policies scoped to the minimum required permissions (principle of least privilege).
- Secrets must not appear in application logs, error messages, or HTTP responses.

## Secret Rotation Policy

| Secret Type | Rotation Frequency |
|---|---|
| API keys (third-party services) | Every 90 days or on suspected exposure |
| Database credentials | Every 180 days or on suspected exposure |
| JWT signing keys | Every 365 days, rolling rotation with overlap period |
| CI/CD secrets | Immediately when a team member with access departs |
| Service-to-service tokens | Every 90 days |

When rotating a secret:
1. Generate the new value in the secrets manager first.
2. Update all consumers (services, CI pipelines) to use the new value.
3. Verify all consumers are operational with the new value.
4. Revoke the old value.
5. Document the rotation in the audit log.

## Audit Logging for Secret Access

- All read and write operations on secrets stored in Vault or AWS Secrets Manager must be captured in an audit log.
- Audit logs must record: timestamp, principal (user or service identity), secret name (not value), action (read / create / update / delete), and source IP or service identifier.
- Audit logs are retained for a minimum of 90 days and are stored in a location separate from application logs.
- Access to audit logs is restricted to security-designated team members.
- Review audit logs at least monthly and immediately following any security incident or suspected exposure.
