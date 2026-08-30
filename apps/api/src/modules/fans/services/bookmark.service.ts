import { creatorService } from "../../creators/services/creator.service.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { bookmarkRepository } from "../repositories/bookmark.repository.js"
import { fanService } from "./fan.service.js"
import { toBookmarkResponse, type BookmarkResponse } from "../types/bookmark.types.js"

async function requireFanProfile(userId: string) {
  const fan = await fanService.findByUserId(userId)
  if (!fan) {
    throw new AppError(404, "FAN_NOT_FOUND", "Fan profile not found")
  }
  return fan
}

export const bookmarkService = {
  async listForUser(userId: string): Promise<BookmarkResponse[]> {
    const fan = await requireFanProfile(userId)
    const bookmarks = await bookmarkRepository.findByFanId(fan.id)
    return bookmarks.map(toBookmarkResponse)
  },

  async create(userId: string, creatorId: string): Promise<BookmarkResponse> {
    const fan = await requireFanProfile(userId)

    const creator = await creatorService.findById(creatorId)
    if (!creator) {
      throw new AppError(404, "CREATOR_NOT_FOUND", "Creator profile not found")
    }

    const existing = await bookmarkRepository.findByFanAndCreator(fan.id, creatorId)
    if (existing) {
      return toBookmarkResponse(existing)
    }

    const bookmark = await bookmarkRepository.create(fan.id, creatorId)
    return toBookmarkResponse(bookmark)
  },

  async remove(userId: string, creatorId: string): Promise<void> {
    const fan = await requireFanProfile(userId)

    const existing = await bookmarkRepository.findByFanAndCreator(fan.id, creatorId)
    if (!existing) {
      throw new AppError(404, "BOOKMARK_NOT_FOUND", "Bookmark not found")
    }

    await bookmarkRepository.deleteByFanAndCreator(fan.id, creatorId)
  },
}
