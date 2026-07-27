/** Raw inputs used to rank a creator on discovery surfaces. */
export interface DiscoveryRankingInput {
  tags: string[]
  lastActiveAt: Date
  createdAt: Date
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function daysSince(date: Date, now: Date): number {
  return Math.max(0, (now.getTime() - date.getTime()) / MS_PER_DAY)
}

/**
 * Scores a creator for discovery ranking: more tags, recent activity, and
 * newer profiles all push the score up. Freshness and activity decay over
 * time so stale profiles fall behind naturally.
 */
export function computeRankingScore(
  input: DiscoveryRankingInput,
  now: Date = new Date()
): number {
  const tagScore = input.tags.length * 2
  const activityScore = 50 / (1 + daysSince(input.lastActiveAt, now))
  const freshnessScore = 20 / (1 + daysSince(input.createdAt, now) / 30)

  return tagScore + activityScore + freshnessScore
}
