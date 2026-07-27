# Linked-Wallet Status Card Guide

This document details the linked wallet status card UI component, connection metadata schemas, and status retrieval services in Chordially.

## Components & Services

1. **Wallet Retrieval Service**:
   - `apps/api/src/modules/wallet/services/wallet-status-retrieval.service.ts`: Service retrieving user wallet connection state.

2. **Web UI Status Card**:
   - `LinkedWalletStatusCard`: React component displaying connected Stellar public keys and network badges.

3. **Validation Schemas & Interfaces**:
   - `walletAccountCardStateSchema` and `WalletAccountCardState` defined in `@chordially/shared`.
