# Wallet Challenge Replay Protection Specification

This document details the single-use nonce validation rules, replay prevention caches, and TTL expiration settings in Chordially.

## Architecture

1. **Replay Protection Service**:
   - `apps/api/src/modules/wallet/services/challenge-replay-protection.service.ts`: `ChallengeReplayProtectionService` maintaining consumed nonce sets.

2. **Web Client Freshness Guard**:
   - `apps/web/src/lib/wallet-replay-guard-client.ts`: Utility function `isChallengeNonceFresh`.

3. **Validation Schemas & Interfaces**:
   - `challengeValidationResultSchema` and `ChallengeValidationResult` defined in `@chordially/shared`.
