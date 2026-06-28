import type { Follow } from "@prisma/client"

export interface FollowRecord {
  id: string
  followerId: string
  followingId: string
  createdAt: Date
}

export function toFollowResponse(follow: Follow): { id: string; followerId: string; followingId: string; createdAt: string } {
  return {
    id: follow.id,
    followerId: follow.followerId,
    followingId: follow.followingId,
    createdAt: follow.createdAt.toISOString(),
  }
}
