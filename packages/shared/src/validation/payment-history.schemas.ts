import { z } from 'zod';

export const paymentTransactionStatusSchema = z.enum(['succeeded', 'processing', 'failed', 'refunded']);
export const paymentMethodTypeSchema = z.enum(['card', 'apple_pay', 'google_pay', 'crypto_wallet']);

export const paymentRecordItemSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required.'),
  senderId: z.string().min(1, 'Sender ID is required.'),
  recipientCreatorId: z.string().min(1, 'Recipient creator ID is required.'),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default('USD'),
  paymentMethod: paymentMethodTypeSchema,
  status: paymentTransactionStatusSchema,
  createdTimestamp: z.string().min(1),
});

export type PaymentRecordItemInput = z.infer<typeof paymentRecordItemSchema>;
