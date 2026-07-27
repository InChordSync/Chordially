/**
 * Read model for fast follower/following counts, decoupled from the
 * write-side follow-graph storage so lookups stay O(1).
 */
export interface FollowCounts {
  creatorId: string
  followerCount: number
  followingCount: number
}

export function toFollowCounts(
  creatorId: string,
  followerCount: number,
  followingCount: number
): FollowCounts {
  return {
    creatorId,
    followerCount: Math.max(0, followerCount),
    followingCount: Math.max(0, followingCount),
  }
}

export function applyFollowDelta(
  counts: FollowCounts,
  followerDelta: number
): FollowCounts {
  return {
    ...counts,
    followerCount: Math.max(0, counts.followerCount + followerDelta),
  }
}
