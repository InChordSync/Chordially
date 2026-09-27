import { randomUUID } from "node:crypto"

/**
 * A fan's saved reference to a creator, for a "saved creators" / bookmarks
 * list. The in-memory `FanBookmark` type and helpers below mirror the
 * persisted `Bookmark` model (see the prisma schema) for callers that work
 * with plain values.
 */
export interface FanBookmark {
  id: string
  fanId: string
  creatorId: string
  createdAt: string
}

export interface BookmarkResponse {
  id: string
  creatorId: string
  createdAt: string
}

export function createBookmark(fanId: string, creatorId: string): FanBookmark {
  return {
    id: randomUUID(),
    fanId,
    creatorId,
    createdAt: new Date().toISOString(),
  }
}

export function isBookmarked(
  bookmarks: FanBookmark[],
  creatorId: string
): boolean {
  return bookmarks.some((b) => b.creatorId === creatorId)
}

export function toBookmarkResponse(bookmark: {
  id: string
  creatorId: string
  createdAt: Date
}): BookmarkResponse {
  return {
    id: bookmark.id,
    creatorId: bookmark.creatorId,
    createdAt: bookmark.createdAt.toISOString(),
  }
}
