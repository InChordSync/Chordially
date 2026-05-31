# Auth Contributor Glossary

- `signed_out`: no active auth session.
- `email_unverified`: account exists but verification step is incomplete.
- `signed_in`: active session and resolved role.
- `forbidden`: authenticated user lacks permission for requested action.
- `session_restore`: client bootstrap step that rehydrates prior auth state.
- `challenge_boundary`: optional future checkpoint (biometric/MFA), not mandatory in starter.
