import { randomUUID } from "node:crypto"

/**
 * A fan's saved reference to a creator, for a lightweight "bookmarks" list.
 */
export interface FanBookmark {
  id: string
  fanId: string
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
