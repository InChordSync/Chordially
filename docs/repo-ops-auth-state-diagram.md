# Cross-App Auth State Diagram

```mermaid
flowchart LR
  A["SignedOut"] --> B["Registering"]
  B --> C["EmailVerificationPending"]
  C --> D["SignedInSession"]
  D --> E["SessionRefresh"]
  E --> D
  D --> F["ChallengeBoundaryOptional"]
  F --> D
  D --> G["SignedOut"]
  E --> H["SessionExpired"]
  H --> A
```

## Notes
- `ChallengeBoundaryOptional` is an extension seam for biometric/MFA and is non-blocking in the starter.
- Session-refresh failure transitions to `SessionExpired` and then back to `SignedOut`.
