# Payment Idempotency Protection Specification

This document details the UUID idempotency header requirements, request locking mechanisms, and duplicate submission prevention in Chordially.

## Architecture

1. **Idempotency Guard Service**:
   - `apps/api/src/modules/payments/services/payment-idempotency-guard.service.ts`: `PaymentIdempotencyGuardService` validating and locking idempotency keys.

2. **Web Key Generator**:
   - `apps/web/src/lib/idempotent-payment-client.ts`: Utility function `generatePaymentIdempotencyKey`.

3. **Validation Schemas & Interfaces**:
   - `idempotencyKeyRecordSchema` and `DuplicateCheckResult` defined in `@chordially/shared`.
