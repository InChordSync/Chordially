export type SupportTier = "supporter" | "superfan" | "champion";

export interface RewardThreshold {
  tier: SupportTier;
  minAmountXLM: number;
  rewards: string[];
}

export const rewardThresholds: RewardThreshold[] = [
  { tier: "supporter", minAmountXLM: 10, rewards: ["badge:supporter", "emote:wave"] },
  {
    tier: "superfan",
    minAmountXLM: 50,
    rewards: ["badge:superfan", "emote:star", "exclusive:monthly-update"],
  },
  {
    tier: "champion",
    minAmountXLM: 200,
    rewards: ["badge:champion", "emote:crown", "exclusive:merch-discount", "shoutout"],
  },
];

export function getEntitledRewards(totalSupportedXLM: number): string[] {
  return rewardThresholds
    .filter((t) => totalSupportedXLM >= t.minAmountXLM)
    .flatMap((t) => t.rewards);
}

export function getTier(totalSupportedXLM: number): SupportTier | null {
  const tiers = rewardThresholds.filter((t) => totalSupportedXLM >= t.minAmountXLM);
  return tiers.length ? tiers[tiers.length - 1].tier : null;
}
