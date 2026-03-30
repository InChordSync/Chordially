import crypto from "node:crypto";

export type RewardTier = "bronze" | "silver" | "gold" | "backstage";

export interface BackstageReward {
  id: string;
  fanId: string;
  artistProfileId: string;
  sessionId?: string;
  tier: RewardTier;
  label: string;
  issuedAt: Date;
  expiresAt?: Date;
}

const rewardStore = new Map<string, BackstageReward>();

function getTier(totalTipsAmount: number): RewardTier {
  if (totalTipsAmount >= 500) return "backstage";
  if (totalTipsAmount >= 200) return "gold";
  if (totalTipsAmount >= 50) return "silver";
  return "bronze";
}

function getTierLabel(tier: RewardTier): string {
  const labels: Record<RewardTier, string> = {
    bronze: "Bronze Fan",
    silver: "Silver Supporter",
    gold: "Gold Backer",
    backstage: "Backstage Pass"
  };
  return labels[tier];
}

export function issueReward(input: {
  fanId: string;
  artistProfileId: string;
  sessionId?: string;
  totalTipsAmount: number;
}): BackstageReward {
  const tier = getTier(input.totalTipsAmount);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const reward: BackstageReward = {
    id: crypto.randomUUID(),
    fanId: input.fanId,
    artistProfileId: input.artistProfileId,
    sessionId: input.sessionId,
    tier,
    label: getTierLabel(tier),
    issuedAt: now,
    expiresAt
  };

  rewardStore.set(reward.id, reward);
  return reward;
}

export function getRewardsForFan(fanId: string): BackstageReward[] {
  return Array.from(rewardStore.values()).filter((r) => r.fanId === fanId);
}

export function getRewardsForArtist(artistProfileId: string): BackstageReward[] {
  return Array.from(rewardStore.values()).filter(
    (r) => r.artistProfileId === artistProfileId
  );
}
