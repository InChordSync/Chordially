import { AppError } from "../../../shared/errors/app-error.js"
import { creatorRepository } from "../../creators/repositories/creator.repository.js"
import { bookmarkRepository } from "../repositories/bookmark.repository.js"

export const bookmarkService = {
  async bookmark(userId: string, creatorSlug: string) {
    const profile = await creatorRepository.findBySlug(creatorSlug)
    if (!profile) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    const existing = await bookmarkRepository.findByUserAndCreator(userId, profile.id)
    if (existing) {
      throw new AppError(409, "ALREADY_BOOKMARKED", "Creator is already bookmarked")
    }

    const bookmark = await bookmarkRepository.create(userId, profile.id)
    return bookmark
  },

  async removeBookmark(userId: string, creatorSlug: string) {
    const profile = await creatorRepository.findBySlug(creatorSlug)
    if (!profile) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    const existing = await bookmarkRepository.findByUserAndCreator(userId, profile.id)
    if (!existing) {
      throw new AppError(404, "NOT_BOOKMARKED", "Creator is not bookmarked")
    }

    await bookmarkRepository.delete(existing.id)
  },

  async getBookmarks(userId: string, page: number, pageSize: number) {
    const { bookmarks, total } = await bookmarkRepository.findBookmarks(
      userId,
      page,
      pageSize
    )

    return {
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        creator: {
          id: b.user.creatorProfile?.id ?? "",
          displayName: b.user.creatorProfile?.displayName ?? "Unknown",
          slug: b.user.creatorProfile?.slug ?? "",
          avatarUrl: b.user.creatorProfile?.avatarUrl ?? null,
          genre: b.user.creatorProfile?.genre ?? null,
          location: b.user.creatorProfile?.location ?? null,
          isVerified: b.user.creatorProfile?.isVerified ?? false,
        },
        createdAt: b.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    }
  },
}
