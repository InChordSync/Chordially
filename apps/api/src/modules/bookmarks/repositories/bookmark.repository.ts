import { prisma } from "../../../shared/database/prisma.js"
import type { BookmarkRecord } from "../types/bookmark.types.js"

export const bookmarkRepository = {
  findByUserAndCreator(
    userId: string,
    creatorId: string
  ): Promise<BookmarkRecord | null> {
    return prisma.bookmark.findUnique({
      where: { userId_creatorId: { userId, creatorId } },
    })
  },

  create(userId: string, creatorId: string): Promise<BookmarkRecord> {
    return prisma.bookmark.create({
      data: { userId, creatorId },
    })
  },

  delete(id: string): Promise<BookmarkRecord> {
    return prisma.bookmark.delete({ where: { id } })
  },

  async deleteByUserAndCreator(
    userId: string,
    creatorId: string
  ): Promise<void> {
    await prisma.bookmark.delete({
      where: { userId_creatorId: { userId, creatorId } },
    })
  },

  async findBookmarks(userId: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize
    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              creatorProfile: {
                select: {
                  id: true,
                  displayName: true,
                  slug: true,
                  avatarUrl: true,
                  genre: true,
                  location: true,
                  isVerified: true,
                },
              },
            },
          },
        },
      }),
      prisma.bookmark.count({ where: { userId } }),
    ])
    return { bookmarks, total }
  },

  async countByCreator(creatorId: string): Promise<number> {
    return prisma.bookmark.count({ where: { creatorId } })
  },
}
