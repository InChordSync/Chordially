# Auth Smoke Commands

Run these before publishing auth-related issues or PRs:

1. `pnpm --filter @chordially/api test`
2. `pnpm --filter @chordially/web test`
3. `pnpm --filter @chordially/mobile test`
4. `pnpm repo:health`

Expected baseline:
- No failing auth tests.
- No missing auth env warnings in local startup logs.
