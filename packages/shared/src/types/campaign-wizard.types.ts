export type CampaignWizardStep = 'basic_info' | 'goal_setting' | 'rewards' | 'review_publish';

export interface CampaignTargetGoal {
  targetAmountCents: number;
  currency: string;
  deadlineIsoDate: string;
}

export interface CampaignMetadataRecord {
  campaignId: string;
  creatorId: string;
  title: string;
  description: string;
  goal: CampaignTargetGoal;
  status: 'draft' | 'active' | 'funded' | 'closed';
  createdAt: string;
}
