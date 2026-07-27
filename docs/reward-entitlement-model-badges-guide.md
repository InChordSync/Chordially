# Digital Reward Entitlement & Badge Rendering Guide

This document details the reward unlock criteria, fan entitlement evaluation services, and web badge UI components in Chordially.

## Architecture

1. **Entitlement Evaluation Service**:
   - `apps/api/src/modules/rewards/services/reward-entitlement.service.ts`: `RewardEntitlementService` checking total fan support against threshold tiers.

2. **Web Badge Component**:
   - `RewardBadgeRendererCard`: React component rendering unlocked reward badges.

3. **Validation Schemas & Interfaces**:
   - `fanEntitlementRecordSchema` and `DigitalRewardTier` defined in `@chordially/shared`.
