# Stellar Tip Submission & Payment Intent Guide

This document details the tip submission endpoints, Stellar XDR construction rules, and web client helpers in Chordially.

## Architecture & Services

1. **Tip Submission Service**:
   - `apps/api/src/modules/tips/services/tip-submission.service.ts`: `TipSubmissionService` creating payment intents and mock XDR envelopes.

2. **Web API Client**:
   - `apps/web/src/lib/tip-submission-client.ts`: Utility function `submitTipToCreator` sending payloads to backend APIs.

3. **Validation Schemas & Interfaces**:
   - `tipSubmissionPayloadSchema` and `PaymentIntentRecord` defined in `@chordially/shared`.
