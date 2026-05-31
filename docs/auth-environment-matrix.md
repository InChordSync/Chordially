# Auth Environment Matrix

This matrix tracks auth-related defaults and toggles across reset monorepo apps.

| Surface | Variable | Dev Default | Test Default | Prod Expectation | Notes |
|---|---|---:|---:|---:|---|
| API | `AUTH_ACCESS_TTL_SECONDS` | `900` | `300` | `900` | Access token TTL |
| API | `AUTH_REFRESH_TTL_SECONDS` | `604800` | `3600` | `604800` | Refresh token TTL |
| API | `AUTH_LOCKOUT_MAX_ATTEMPTS` | `5` | `3` | `5` | Failed-attempt threshold |
| API | `AUTH_LOCKOUT_WINDOW_SECONDS` | `900` | `120` | `900` | Lockout window |
| Web | `NEXT_PUBLIC_AUTH_CHALLENGE_ENABLED` | `false` | `true` | `true` | Future challenge boundary |
| Mobile | `EXPO_PUBLIC_AUTH_CHALLENGE_ENABLED` | `false` | `true` | `true` | Future biometric/challenge seam |
| Mobile | `EXPO_PUBLIC_AUTH_OFFLINE_RESTORE` | `true` | `true` | `true` | Session restore behavior toggle |

## Usage
- Prefer app-level env readers to hard-coded auth constants.
- Keep this table updated in the same PR that adds or changes auth env vars.
