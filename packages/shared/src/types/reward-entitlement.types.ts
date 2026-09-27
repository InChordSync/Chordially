export interface RewardUnlockCriterion {
  minSupportCents: number;
  currency: string;
}

export interface DigitalRewardTier {
  tierId: string;
  badgeName: string;
  iconSymbol: string;
  criterion: RewardUnlockCriterion;
}

export interface FanEntitlementRecord {
  entitlementId: string;
  fanId: string;
  creatorId: string;
  unlockedTier: DigitalRewardTier;
  unlockedAtIso: string;
}
