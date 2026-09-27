import { z } from 'zod';

export const tipSubmissionPayloadSchema = z.object({
  creatorId: z.string().min(1, 'Creator ID is required.'),
  amountXlm: z.number().positive('Tip amount must be positive.').max(10000),
  senderPublicKey: z.string().min(10, 'Sender public key is invalid.'),
  memoText: z.string().max(28).optional(),
});

export const paymentIntentRecordSchema = z.object({
  intentId: z.string().min(1, 'Intent ID is required.'),
  creatorId: z.string().min(1, 'Creator ID is required.'),
  senderAddress: z.string().optional(),
  tipAmountXlm: z.number().positive(),
  status: z.enum(['created', 'submitted', 'confirmed', 'failed']),
  createdAt: z.string().min(1),
});

export type TipSubmissionPayloadInput = z.infer<typeof tipSubmissionPayloadSchema>;
export type PaymentIntentRecordInput = z.infer<typeof paymentIntentRecordSchema>;
