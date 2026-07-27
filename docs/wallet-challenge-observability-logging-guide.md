# Wallet Challenge Observability-Safe Logging Guide

This document specifies the observability-safe logging format, address masking functions, and audit logging services for wallet events in Chordially.

## Architecture

1. **Audit Logger Service**:
   - `apps/api/src/modules/wallet/services/wallet-audit-logger.service.ts`: `WalletAuditLoggerService` redacting full wallet addresses into masked audit logs.

2. **Web Client Sanitizer**:
   - `apps/web/src/lib/wallet-audit-sanitizer-client.ts`: Utility function `maskWalletPublicKeyForLogging`.

3. **Validation Schemas & Interfaces**:
   - `sanitizedWalletLogPayloadSchema` and `SanitizedWalletLogPayload` defined in `@chordially/shared`.
