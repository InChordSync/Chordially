/** A creator's public activity signals used to compute a trending feed. */
export interface TrendingSignal {
  creatorId: string
  followerCount: number
  newFollowers7d: number
  streamCount7d: number
}

function trendingScore(signal: TrendingSignal): number {
  return (
    signal.newFollowers7d * 3 +
    signal.streamCount7d * 2 +
    Math.log10(signal.followerCount + 1)
  )
}

/**
 * Ranks creators by recent, high-signal activity rather than raw follower
 * count, so newer creators can surface in the trending feed.
 */
export function rankTrending(
  signals: TrendingSignal[],
  limit = 20
): TrendingSignal[] {
  return [...signals]
    .sort((a, b) => trendingScore(b) - trendingScore(a))
    .slice(0, limit)
}
