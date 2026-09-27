import { z } from 'zod';

export const campaignTargetGoalSchema = z.object({
  targetAmountCents: z.number().int().positive('Goal amount must be positive.'),
  currency: z.string().length(3).default('USD'),
  deadlineIsoDate: z.string().min(1, 'Deadline date is required.'),
});

export const campaignMetadataRecordSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required.'),
  creatorId: z.string().min(1, 'Creator ID is required.'),
  title: z.string().trim().min(3, 'Campaign title must be at least 3 chars.').max(120),
  description: z.string().max(1000).default(''),
  goal: campaignTargetGoalSchema,
  status: z.enum(['draft', 'active', 'funded', 'closed']).default('draft'),
  createdAt: z.string().min(1),
});

export type CampaignMetadataRecordInput = z.infer<typeof campaignMetadataRecordSchema>;
export type CampaignTargetGoalInput = z.infer<typeof campaignTargetGoalSchema>;
