# Wallet-Link Session Challenge & Verification Guide

This document specifies the challenge session lifecycle, cryptographic signature verification workflows, and wallet badge UI components in Chordially.

## Architecture

1. **Session & Verification Service**:
   - `apps/api/src/modules/wallet/services/wallet-link-session.service.ts`: `WalletLinkSessionService` issuing nonces and verifying signature payloads.

2. **Web UI Badge Component**:
   - `WalletLinkVerificationBadge`: React component displaying linked wallet addresses and verification status badges.

3. **Validation Schemas & Interfaces**:
   - `walletLinkChallengeSessionSchema` and `WalletLinkChallengeSession` defined in `@chordially/shared`.
