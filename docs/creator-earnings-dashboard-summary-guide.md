# Creator Earnings Summary Card Specification

This document outlines the creator earnings dashboard summary layout, currency amount Zod schemas, and tip formatting utilities in Chordially.

## Components & Utilities

1. **Tip Formatter Utility**:
   - `packages/shared/src/utils/tip-amount-formatter.ts`: `TipAmountFormatter` converting cents to formatted currency strings.

2. **Web Dashboard Component**:
   - `CreatorEarningsSummaryCard`: React component displaying lifetime earnings and pending payout metrics.

3. **Validation Schemas & Interfaces**:
   - `creatorEarningsSummarySchema` and `CurrencyAmount` defined in `@chordially/shared`.
