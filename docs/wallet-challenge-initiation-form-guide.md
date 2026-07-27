# Wallet Challenge Initiation Form Guide

This document details the wallet challenge initiation form component, public address schemas, and challenge generation API services in Chordially.

## Architecture

1. **Challenge Initiation Service**:
   - `apps/api/src/modules/wallet/services/wallet-challenge-initiation.service.ts`: `WalletChallengeInitiationService` generating sign nonces.

2. **Web Form Component**:
   - `WalletChallengeInitiationForm`: React component rendering wallet address inputs and challenge initiation controls.

3. **Validation Schemas & Interfaces**:
   - `walletInitiationFormDataSchema` and `ChallengeResponsePayload` defined in `@chordially/shared`.
