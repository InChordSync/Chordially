import { z } from 'zod';

export const rewardUnlockCriterionSchema = z.object({
  minSupportCents: z.number().int().positive('Minimum support must be positive.'),
  currency: z.string().length(3).default('USD'),
});

export const digitalRewardTierSchema = z.object({
  tierId: z.string().min(1, 'Tier ID is required.'),
  badgeName: z.string().min(1, 'Badge name is required.'),
  iconSymbol: z.string().min(1),
  criterion: rewardUnlockCriterionSchema,
});

export const fanEntitlementRecordSchema = z.object({
  entitlementId: z.string().min(1, 'Entitlement ID is required.'),
  fanId: z.string().min(1, 'Fan ID is required.'),
  creatorId: z.string().min(1, 'Creator ID is required.'),
  unlockedTier: digitalRewardTierSchema,
  unlockedAtIso: z.string().min(1),
});

export type DigitalRewardTierInput = z.infer<typeof digitalRewardTierSchema>;
export type FanEntitlementRecordInput = z.infer<typeof fanEntitlementRecordSchema>;
