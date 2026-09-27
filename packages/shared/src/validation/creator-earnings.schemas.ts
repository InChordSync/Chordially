import { z } from 'zod';

export const currencyAmountSchema = z.object({
  amountCents: z.number().int().min(0),
  currency: z.string().length(3).default('USD'),
  formattedText: z.string().optional(),
});

export const monthlyPayoutBreakdownSchema = z.object({
  monthYear: z.string().min(1),
  grossTipsCents: z.number().int().min(0),
  platformFeeCents: z.number().int().min(0),
  netPayoutCents: z.number().int().min(0),
  payoutStatus: z.enum(['completed', 'pending', 'processing']),
});

export const creatorEarningsSummarySchema = z.object({
  creatorId: z.string().min(1, 'Creator ID is required.'),
  lifetimeEarnings: currencyAmountSchema,
  pendingPayout: currencyAmountSchema,
  currentMonthEarnings: currencyAmountSchema,
  recentPayouts: z.array(monthlyPayoutBreakdownSchema).default([]),
});

export type CreatorEarningsSummaryInput = z.infer<typeof creatorEarningsSummarySchema>;
