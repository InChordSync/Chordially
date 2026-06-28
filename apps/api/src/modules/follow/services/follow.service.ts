import { AppError } from "../../../shared/errors/app-error.js"
import { creatorRepository } from "../../creators/repositories/creator.repository.js"
import { followRepository } from "../repositories/follow.repository.js"

export const followService = {
  async follow(userId: string, creatorSlug: string) {
    const profile = await creatorRepository.findBySlug(creatorSlug)
    if (!profile) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    if (profile.userId === userId) {
      throw new AppError(400, "CANNOT_FOLLOW_SELF", "You cannot follow yourself")
    }

    const existing = await followRepository.findByFollowerAndFollowing(
      userId,
      profile.userId
    )
    if (existing) {
      throw new AppError(409, "ALREADY_FOLLOWING", "You are already following this creator")
    }

    const follow = await followRepository.create(userId, profile.userId)
    return follow
  },

  async unfollow(userId: string, creatorSlug: string) {
    const profile = await creatorRepository.findBySlug(creatorSlug)
    if (!profile) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    const existing = await followRepository.findByFollowerAndFollowing(
      userId,
      profile.userId
    )
    if (!existing) {
      throw new AppError(404, "NOT_FOLLOWING", "You are not following this creator")
    }

    await followRepository.delete(existing.id)
  },

  async getFollowers(creatorSlug: string, page: number, pageSize: number) {
    const profile = await creatorRepository.findBySlug(creatorSlug)
    if (!profile) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    const { follows, total } = await followRepository.findFollowers(
      profile.userId,
      page,
      pageSize
    )

    return {
      followers: follows.map((f) => ({
        id: f.id,
        follower: {
          id: f.follower.id,
          displayName: f.follower.email,
          avatarUrl: null,
        },
        createdAt: f.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    }
  },

  async getFollowing(userId: string, page: number, pageSize: number) {
    const { follows, total } = await followRepository.findFollowing(
      userId,
      page,
      pageSize
    )

    return {
      following: follows.map((f) => ({
        id: f.id,
        creator: {
          id: f.following.creatorProfile?.id ?? f.following.id,
          displayName: f.following.creatorProfile?.displayName ?? f.following.email,
          slug: f.following.creatorProfile?.slug ?? "",
          avatarUrl: f.following.creatorProfile?.avatarUrl ?? null,
          genre: f.following.creatorProfile?.genre ?? null,
        },
        createdAt: f.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    }
  },

  async getFollowCount(creatorSlug: string) {
    const profile = await creatorRepository.findBySlug(creatorSlug)
    if (!profile) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    const [followers, following] = await Promise.all([
      followRepository.countFollowers(profile.userId),
      followRepository.countFollowing(profile.userId),
    ])

    return { followers, following, creatorSlug: profile.slug }
  },
}
