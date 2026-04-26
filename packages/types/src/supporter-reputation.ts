// CHORD-037: Supporter reputation schema — badges, streaks, and levels
// Canonical document structure for MongoDB-backed supporter reputation.

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export interface Badge {
  id: string;
  name: string;
  tier: BadgeTier;
  awardedAt: Date;
  artistId: string; // scoped per-artist or "global"
}

export interface Streak {
  currentDays: number;
  longestDays: number;
  lastActivityAt: Date;
}

export interface ReputationLevel {
  level: number;       // 1–100
  xp: number;          // cumulative XP
  nextLevelXp: number; // XP required for next level
}

/** Primary document stored in `supporter_reputations` collection. */
export interface SupporterReputation {
  _id: string;           // MongoDB ObjectId as string
  userId: string;
  artistId: string;      // per-artist reputation record
  level: ReputationLevel;
  streak: Streak;
  badges: Badge[];
  totalTipped: number;   // lifetime USD-equivalent
  createdAt: Date;
  updatedAt: Date;
}

// Indexes:
//   { userId: 1, artistId: 1 }  unique — primary lookup
//   { artistId: 1, "level.level": -1 }  — leaderboard queries

export function calcNextLevelXp(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level));
}

export function awardXp(
  rep: SupporterReputation,
  xpGain: number
): SupporterReputation {
  const xp = rep.level.xp + xpGain;
  let { level } = rep.level;
  let nextLevelXp = rep.level.nextLevelXp;

  while (xp >= nextLevelXp && level < 100) {
    level += 1;
    nextLevelXp = calcNextLevelXp(level);
  }

  return { ...rep, level: { level, xp, nextLevelXp }, updatedAt: new Date() };
}
