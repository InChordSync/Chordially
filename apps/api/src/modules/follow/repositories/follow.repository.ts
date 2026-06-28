import { prisma } from "../../../shared/database/prisma.js"
import type { FollowRecord } from "../types/follow.types.js"

export const followRepository = {
  findById(id: string): Promise<FollowRecord | null> {
    return prisma.follow.findUnique({ where: { id } })
  },

  findByFollowerAndFollowing(
    followerId: string,
    followingId: string
  ): Promise<FollowRecord | null> {
    return prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    })
  },

  create(followerId: string, followingId: string): Promise<FollowRecord> {
    return prisma.follow.create({
      data: { followerId, followingId },
    })
  },

  delete(id: string): Promise<FollowRecord> {
    return prisma.follow.delete({ where: { id } })
  },

  async countFollowers(userId: string): Promise<number> {
    return prisma.follow.count({ where: { followingId: userId } })
  },

  async countFollowing(userId: string): Promise<number> {
    return prisma.follow.count({ where: { followerId: userId } })
  },

  async findFollowers(userId: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize
    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          follower: {
            select: { id: true, email: true },
          },
        },
      }),
      prisma.follow.count({ where: { followingId: userId } }),
    ])
    return { follows, total }
  },

  async findFollowing(userId: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize
    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          following: {
            select: {
              id: true,
              email: true,
              creatorProfile: {
                select: {
                  id: true,
                  displayName: true,
                  slug: true,
                  avatarUrl: true,
                  genre: true,
                },
              },
            },
          },
        },
      }),
      prisma.follow.count({ where: { followerId: userId } }),
    ])
    return { follows, total }
  },

  async deleteByFollowerAndFollowing(followerId: string, followingId: string): Promise<void> {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    })
  },
}
