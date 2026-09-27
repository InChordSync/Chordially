# Payment History Table & Status Badges Specification

This document details the payment history table component, transaction record data schemas, and status badge styling in Chordially.

## Components & Modules

1. **Payment History Service**:
   - `apps/api/src/modules/payments/services/payment-history.service.ts`: `PaymentHistoryService` retrieving validated transaction logs.

2. **Web Table Component**:
   - `PaymentHistoryTable`: React component rendering transaction rows with status badges.

3. **Validation Schemas & Interfaces**:
   - `paymentRecordItemSchema` and `PaymentRecordItem` defined in `@chordially/shared`.
