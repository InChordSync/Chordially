# Stellar Horizon Adapter Boundary Specification

This document specifies the Horizon node adapter boundary, public key validation rules, and network response contracts in Chordially.

## Architecture

1. **Horizon Adapter Boundary**:
   - `packages/shared/src/utils/horizon-adapter-boundary.ts`: `HorizonAdapterBoundary` providing account queries and passphrase configuration.

2. **API Service Integration**:
   - `apps/api/src/modules/stellar/services/stellar-horizon-client.service.ts`: `StellarHorizonClientService` wrapping Horizon queries.

3. **Validation Schemas & Interfaces**:
   - `horizonAccountResponseSchema` and `HorizonAccountResponse` defined in `@chordially/shared`.
