# Archive Policy for Backlog Waves and Issue Batches

## When to Archive

A backlog wave or issue batch should be archived when:
- All issues in the wave are closed or explicitly deferred
- The sprint or planning period has ended
- The wave has been reviewed and accepted by the team

## Archive Process

1. Label all issues in the completed wave with `archived`
2. Close any remaining deferred issues with a comment linking to the next wave
3. Create a summary comment on the wave tracking issue
4. Move the wave to the `Archive` milestone

## Naming Convention

Archived batches follow the format: `YYYY-MM-DD-wave-N` (e.g. `2025-01-15-wave-3`)

## Retention

- Archived waves are retained indefinitely in GitHub
- Issues are searchable via the `archived` label
- Summary documents are stored in `docs/sprints/`

## Responsibilities

| Role | Responsibility |
|------|----------------|
| Tech Lead | Approves archive decision |
| Sprint Owner | Applies labels and closes deferred issues |
| Any contributor | May flag issues for archive review |
